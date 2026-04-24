type DashboardCardProps = {
  semana: number;
  lote: string;
  sector: string;
  variedad: string;
  fc: number;
  fa: number;
};

export function DashboardCard({
  semana,
  lote,
  sector,
  variedad,
  fc,
  fa
}: DashboardCardProps) {
  const total = fc + fa;

  return (
    <article className="card-base">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#0B7A3B]">
          Semana {semana}
        </p>

        <h3 className="mt-1 text-lg font-bold text-[#10231A]">
          Lote {lote} / Sector {sector}
        </h3>

        <p className="text-sm font-medium text-slate-500">{variedad}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-[#E8F5EE] p-3 text-center">
          <p className="text-xs font-bold text-[#0B7A3B]">FC</p>
          <p className="mt-1 text-2xl font-black text-[#10231A]">{fc}</p>
        </div>

        <div className="rounded-2xl bg-[#E8F5EE] p-3 text-center">
          <p className="text-xs font-bold text-[#0B7A3B]">FA</p>
          <p className="mt-1 text-2xl font-black text-[#10231A]">{fa}</p>
        </div>

        <div className="rounded-2xl bg-slate-100 p-3 text-center">
          <p className="text-xs font-bold text-slate-600">TOTAL</p>
          <p className="mt-1 text-2xl font-black text-[#10231A]">{total}</p>
        </div>
      </div>
    </article>
  );
}