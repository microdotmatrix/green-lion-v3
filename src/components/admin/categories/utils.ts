export function getTypeLabel(type: string) {
  switch (type) {
    case "text":
      return "Text";
    case "number":
      return "Number";
    case "boolean":
      return "Yes/No";
    case "select":
      return "Single Select";
    case "multi_select":
      return "Multi Select";
    default:
      return type;
  }
}
