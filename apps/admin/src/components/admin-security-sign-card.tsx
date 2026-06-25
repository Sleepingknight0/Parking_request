import type { SignOutputMethod } from "@nacc/types";
import { cn } from "@nacc/ui";
import {
  buildAdminSecuritySignLayout,
  type AdminSecuritySignPayload,
} from "@/lib/security-signs";

export function AdminSecuritySignCard({
  payload,
  method,
  className,
}: {
  payload: AdminSecuritySignPayload;
  method: SignOutputMethod;
  className?: string;
}) {
  const isHandwrite = method === "handwrite";
  const layout = buildAdminSecuritySignLayout(payload);

  return (
    <article
      className={cn(
        "security-sign-font relative flex aspect-[297/210] w-full max-w-[min(100%,42rem)] flex-col items-center justify-between border-4 border-black bg-white px-[6%] py-[5%] text-center text-black",
        isHandwrite && "border-dashed",
        className,
      )}
    >
      {isHandwrite ? (
        <p className="absolute left-0 right-0 top-[2%] text-[clamp(0.75rem,2.5vw,1rem)] text-black/70">
          แบบคัดลอก - เขียนด้วยปากกาเมจิก
        </p>
      ) : null}

      <p
        className={cn(
          "w-full break-words font-semibold leading-tight text-black",
          isHandwrite ? "mt-[4%]" : "mt-0",
          "text-[clamp(1.25rem,4.5vw,2rem)]",
        )}
      >
        {layout.top}
      </p>

      <h1 className="w-full flex-1 content-center break-words text-[clamp(2rem,9vw,4.5rem)] font-bold leading-none text-black">
        {layout.center}
      </h1>

      <div className="w-full space-y-0.5 text-[clamp(1rem,3.2vw,1.5rem)] leading-snug text-black">
        {layout.middle.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <div className="mt-[2%] w-full space-y-0.5 text-[clamp(0.8rem,2.5vw,1.125rem)] leading-snug text-black">
        {layout.bottom.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </article>
  );
}
