export function submissionReceivedMessage(studentName: string, assignmentTitle: string) {
  return `${studentName || "Ученик"} отправил решение к заданию «${assignmentTitle}».`;
}

export function autoCheckMessage(assignmentTitle: string, passed: boolean) {
  return passed
    ? `Задание «${assignmentTitle}» пройдено автоматически.`
    : `В задании «${assignmentTitle}» есть непройденные тесты. Исправьте код и отправьте его снова.`;
}

export function reviewMessage(assignmentTitle: string, status: "approved" | "revision", comment?: string | null) {
  return status === "approved"
    ? `Задание «${assignmentTitle}» зачтено преподавателем.`
    : `По заданию «${assignmentTitle}» есть комментарий преподавателя: ${comment || "нужно внести исправления"}`;
}
