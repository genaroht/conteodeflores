type ExportExcelButtonProps = {
  href: string;
  label?: string;
};

export function ExportExcelButton({
  href,
  label = "Exportar Excel"
}: ExportExcelButtonProps) {
  return (
    <a href={href} className="button-primary">
      {label}
    </a>
  );
}