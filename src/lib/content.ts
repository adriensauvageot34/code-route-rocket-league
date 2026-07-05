import content from "@/data/content.json";
import type {
  Answer,
  Capture,
  Category,
  ContentQuestion,
  ContentQuestionSummary,
  ErrorTag,
  GlossaryTerm,
  QuestionCategoryLabels,
  Subcategory,
  TrainingContent
} from "@/types/content";

const trainingContent = content as TrainingContent;

export function getContent(): TrainingContent {
  return trainingContent;
}

export function getCaptures(): Capture[] {
  return getContent().captures;
}

export function getQuestions(): ContentQuestion[] {
  return getContent().questions;
}

export function getActiveQuestions(): ContentQuestion[] {
  return getQuestions();
}

export function getQuestionSummaries(): ContentQuestionSummary[] {
  return getQuestions().map((question) => ({
    id: question.question_id,
    captureId: question.capture_id,
    answerFormat: question.answer_format,
    rlCategory: question.rl_category_primary
  }));
}

export function getCaptureById(captureId: string): Capture | undefined {
  return getCaptures().find((capture) => capture.capture_id === captureId);
}

export function getQuestionImage(question: ContentQuestion): string | undefined {
  return getCaptureById(question.capture_id)?.image_path;
}

export function getGlossaryTermsForQuestion(question: ContentQuestion): GlossaryTerm[] {
  const glossaryById = new Map(getContent().glossary.map((term) => [term.term_id, term]));

  return question.glossary_terms.flatMap((termId) => {
    const term = glossaryById.get(termId);

    return term ? [term] : [];
  });
}

export function getErrorTagsForAnswer(answer: Answer): ErrorTag[] {
  const tagsById = new Map(getContent().error_tags.map((tag) => [tag.tag_id, tag]));

  return answer.error_tags.flatMap((tagId) => {
    const tag = tagsById.get(tagId);

    return tag ? [tag] : [];
  });
}

export function getQuestionCategoryLabels(question: ContentQuestion): QuestionCategoryLabels {
  const categoriesById = new Map(getContent().categories.map((category) => [category.category_id, category]));
  const subcategoriesById = new Map(
    getContent().subcategories.map((subcategory) => [subcategory.subcategory_id, subcategory])
  );

  return {
    cognitivePrimary: getCategoryLabel(categoriesById, question.cognitive_category_primary),
    cognitiveSecondary: question.cognitive_category_secondary
      ? getCategoryLabel(categoriesById, question.cognitive_category_secondary)
      : undefined,
    cognitiveSubcategories: getSubcategoryLabels(subcategoriesById, question.cognitive_subcategories),
    rlPrimary: getCategoryLabel(categoriesById, question.rl_category_primary),
    rlSecondary: question.rl_category_secondary
      ? getCategoryLabel(categoriesById, question.rl_category_secondary)
      : undefined,
    rlSubcategories: getSubcategoryLabels(subcategoriesById, question.rl_subcategories)
  };
}

function getCategoryLabel(categories: Map<string, Category>, categoryId: string): string | undefined {
  return categories.get(categoryId)?.label;
}

function getSubcategoryLabels(
  subcategories: Map<string, Subcategory>,
  subcategoryIds: string[]
): string[] {
  return subcategoryIds.flatMap((subcategoryId) => {
    const subcategory = subcategories.get(subcategoryId);

    return subcategory ? [subcategory.label] : [];
  });
}
