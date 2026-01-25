import {
  CheckSquare,
  Hash,
  List,
  ToggleLeft,
  Type,
} from "lucide-react";

import type { AttributeType } from "./types";

export function getTypeIcon(type: AttributeType) {
  switch (type) {
    case "text":
      return <Type className="h-4 w-4" />;
    case "number":
      return <Hash className="h-4 w-4" />;
    case "boolean":
      return <ToggleLeft className="h-4 w-4" />;
    case "select":
      return <List className="h-4 w-4" />;
    case "multi_select":
      return <CheckSquare className="h-4 w-4" />;
  }
}

export function getTypeLabel(type: AttributeType) {
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
  }
}
