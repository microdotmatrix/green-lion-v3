import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CustomerInfo } from "./types";

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function FormField({
  id,
  label,
  required,
  error,
  type = "text",
  value,
  onChange,
  placeholder,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(error && "border-destructive")}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

interface CustomerInfoFormProps {
  customerInfo: CustomerInfo;
  onChange: (info: CustomerInfo) => void;
  errors: Record<string, string>;
}

export function CustomerInfoForm({
  customerInfo,
  onChange,
  errors,
}: CustomerInfoFormProps) {
  const updateField = (field: keyof CustomerInfo, value: string) => {
    onChange({ ...customerInfo, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Customer Information</CardTitle>
        <CardDescription>
          Fields marked with <span className="text-destructive">*</span> are
          required
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            id="firstName"
            label="First Name"
            required
            value={customerInfo.firstName}
            onChange={(v) => updateField("firstName", v)}
            placeholder="John"
            error={errors.firstName}
          />
          <FormField
            id="lastName"
            label="Last Name"
            required
            value={customerInfo.lastName}
            onChange={(v) => updateField("lastName", v)}
            placeholder="Doe"
            error={errors.lastName}
          />
          <FormField
            id="email"
            label="Email"
            required
            type="email"
            value={customerInfo.email}
            onChange={(v) => updateField("email", v)}
            placeholder="john.doe@company.com"
            error={errors.email}
          />
          <FormField
            id="phone"
            label="Phone"
            type="tel"
            value={customerInfo.phone}
            onChange={(v) => updateField("phone", v)}
            placeholder="+1 (555) 123-4567"
          />
          <FormField
            id="companyName"
            label="Company Name"
            required
            value={customerInfo.companyName}
            onChange={(v) => updateField("companyName", v)}
            placeholder="ACME Corporation"
            error={errors.companyName}
          />
          <FormField
            id="title"
            label="Job Title"
            value={customerInfo.title}
            onChange={(v) => updateField("title", v)}
            placeholder="Procurement Manager"
          />
        </div>
      </CardContent>
    </Card>
  );
}
