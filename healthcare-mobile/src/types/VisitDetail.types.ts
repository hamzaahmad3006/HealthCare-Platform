export interface DocFieldProps {
  label:       string;
  subtitle:    string;
  placeholder: string;
  value:       string;
  onChange:    (v: string) => void;
}
