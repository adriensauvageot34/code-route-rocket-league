import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CONTENT_PATH = join(process.cwd(), "src", "data", "content.json");
const VALID_ANSWER_FORMATS = new Set(["single", "multiple", "ranking"]);
const REQUIRED_CORRECTION_FIELDS = [
  "expected_answer",
  "what_to_observe",
  "principle",
  "why_tempting",
  "risk_avoided",
  "reflex_phrase"
];

const errors = [];

function addError(type, id, field, message) {
  errors.push(`${type} ${id} - ${field}: ${message}`);
}

function requireString(value, type, id, field) {
  if (typeof value !== "string" || value.trim() === "") {
    addError(type, id, field, "champ texte obligatoire manquant");
    return false;
  }

  return true;
}

function requireArray(value, type, id, field) {
  if (!Array.isArray(value)) {
    addError(type, id, field, "champ tableau obligatoire manquant");
    return false;
  }

  return true;
}

if (!existsSync(CONTENT_PATH)) {
  addError("Fichier", "content.json", "src/data/content.json", "fichier introuvable");
  finish();
}

let content;

try {
  content = JSON.parse(readFileSync(CONTENT_PATH, "utf8"));
} catch (error) {
  addError("Fichier", "content.json", "json", `JSON illisible: ${error.message}`);
  finish();
}

const captures = arrayOrEmpty(content.captures);
const questions = arrayOrEmpty(content.questions);
const glossary = arrayOrEmpty(content.glossary);
const modes = arrayOrEmpty(content.modes);
const categories = arrayOrEmpty(content.categories);
const subcategories = arrayOrEmpty(content.subcategories);
const errorTags = arrayOrEmpty(content.error_tags);

const captureIds = validateUniqueById(captures, "capture_id", "Capture");
const glossaryIds = validateUniqueById(glossary, "term_id", "Glossaire");
const modeIds = validateUniqueById(modes, "mode_id", "Mode");
const categoryIds = validateUniqueById(categories, "category_id", "Categorie");
const subcategoryIds = validateUniqueById(subcategories, "subcategory_id", "Sous-categorie");
const errorTagIds = validateUniqueById(errorTags, "tag_id", "Tag erreur");
const questionIds = validateUniqueById(questions, "question_id", "Question");

for (const capture of captures) {
  const id = capture.capture_id ?? "(sans capture_id)";
  requireString(capture.capture_id, "Capture", id, "capture_id");
  requireString(capture.image_path, "Capture", id, "image_path");

  if (typeof capture.image_path === "string") {
    const imagePath = capture.image_path.replace(/^\/+/, "");

    if (!capture.image_path.startsWith("/captures/")) {
      addError("Capture", id, "image_path", "le chemin doit commencer par /captures/");
    }

    if (!existsSync(join(process.cwd(), "public", imagePath))) {
      addError("Capture", id, "image_path", `image introuvable: public/${imagePath}`);
    }
  }
}

for (const question of questions) {
  const id = question.question_id ?? "(sans question_id)";
  requireString(question.question_id, "Question", id, "question_id");
  requireString(question.capture_id, "Question", id, "capture_id");
  requireString(question.question_text, "Question", id, "question_text");

  if (question.capture_id && !captureIds.has(question.capture_id)) {
    addError("Question", id, "capture_id", `capture inconnue: ${question.capture_id}`);
  }

  if (!VALID_ANSWER_FORMATS.has(question.answer_format)) {
    addError("Question", id, "answer_format", `format invalide: ${question.answer_format}`);
  }

  if (question.pedagogical_mode && !modeIds.has(question.pedagogical_mode)) {
    addError("Question", id, "pedagogical_mode", `mode inconnu: ${question.pedagogical_mode}`);
  }

  validateCategoryReference(question.cognitive_category_primary, "Question", id, "cognitive_category_primary");
  validateCategoryReference(question.cognitive_category_secondary, "Question", id, "cognitive_category_secondary");
  validateCategoryReference(question.rl_category_primary, "Question", id, "rl_category_primary");
  validateCategoryReference(question.rl_category_secondary, "Question", id, "rl_category_secondary");
  validateSubcategoryReferences(question.cognitive_subcategories, "Question", id, "cognitive_subcategories");
  validateSubcategoryReferences(question.rl_subcategories, "Question", id, "rl_subcategories");

  if (!requireArray(question.answers, "Question", id, "answers")) {
    continue;
  }

  if (question.answers.length < 2) {
    addError("Question", id, "answers", "au moins deux reponses sont requises");
  }

  const answerIds = validateUniqueById(question.answers, "answer_id", `Question ${id} reponse`);

  for (const answer of question.answers) {
    const answerId = answer.answer_id ?? "(sans answer_id)";
    requireString(answer.answer_id, "Reponse", `${id}/${answerId}`, "answer_id");
    requireString(answer.text, "Reponse", `${id}/${answerId}`, "text");

    if (requireArray(answer.error_tags, "Reponse", `${id}/${answerId}`, "error_tags")) {
      for (const tagId of answer.error_tags) {
        if (!errorTagIds.has(tagId)) {
          addError("Reponse", `${id}/${answerId}`, "error_tags", `tag inconnu: ${tagId}`);
        }
      }
    }
  }

  if (!requireArray(question.correct_answer_ids, "Question", id, "correct_answer_ids")) {
    continue;
  }

  for (const answerId of question.correct_answer_ids) {
    if (!answerIds.has(answerId)) {
      addError("Question", id, "correct_answer_ids", `answer_id inconnu: ${answerId}`);
    }
  }

  if (question.answer_format === "single" && question.correct_answer_ids.length !== 1) {
    addError("Question", id, "correct_answer_ids", "une question single doit avoir exactement une bonne reponse");
  }

  if (question.answer_format === "multiple" && question.correct_answer_ids.length < 1) {
    addError("Question", id, "correct_answer_ids", "une question multiple doit avoir au moins une bonne reponse");
  }

  if (question.answer_format === "ranking") {
    if (!requireArray(question.correct_ranking, "Question", id, "correct_ranking")) {
      continue;
    }

    for (const answerId of question.correct_ranking) {
      if (!answerIds.has(answerId)) {
        addError("Question", id, "correct_ranking", `answer_id inconnu: ${answerId}`);
      }
    }
  }

  validateCorrection(question.correction, id);

  if (requireArray(question.glossary_terms, "Question", id, "glossary_terms")) {
    for (const termId of question.glossary_terms) {
      if (!glossaryIds.has(termId)) {
        addError("Question", id, "glossary_terms", `terme inconnu: ${termId}`);
      }
    }
  }
}

if (questionIds.size !== questions.length) {
  addError("Contenu", "questions", "question_id", "des identifiants de questions sont dupliques");
}

finish();

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

function validateUniqueById(items, field, type) {
  const ids = new Set();
  const duplicates = new Set();

  for (const item of items) {
    const id = item?.[field];

    if (typeof id !== "string" || id.trim() === "") {
      continue;
    }

    if (ids.has(id)) {
      duplicates.add(id);
    }

    ids.add(id);
  }

  for (const duplicate of duplicates) {
    addError(type, duplicate, field, "identifiant duplique");
  }

  return ids;
}

function validateCategoryReference(categoryId, type, id, field) {
  if (!categoryId) {
    return;
  }

  if (!categoryIds.has(categoryId)) {
    addError(type, id, field, `categorie inconnue: ${categoryId}`);
  }
}

function validateSubcategoryReferences(subcategoryIdsValue, type, id, field) {
  if (!requireArray(subcategoryIdsValue, type, id, field)) {
    return;
  }

  for (const subcategoryId of subcategoryIdsValue) {
    if (!subcategoryIds.has(subcategoryId)) {
      addError(type, id, field, `sous-categorie inconnue: ${subcategoryId}`);
    }
  }
}

function validateCorrection(correction, questionId) {
  if (!correction || typeof correction !== "object") {
    addError("Question", questionId, "correction", "correction obligatoire manquante");
    return;
  }

  for (const field of REQUIRED_CORRECTION_FIELDS) {
    requireString(correction[field], "Question", questionId, `correction.${field}`);
  }
}

function finish() {
  if (errors.length > 0) {
    console.error("Validation du contenu echouee:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Contenu valide: ${captures.length} captures, ${questions.length} questions.`);
}
