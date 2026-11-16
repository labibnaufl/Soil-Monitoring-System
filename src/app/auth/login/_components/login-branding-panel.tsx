import Image from "next/image";

export default function LoginBrandingPanel() {
  return (
    <aside className="relative hidden lg:block p-[22px] min-h-svh overflow-hidden">
      <div className="w-full h-[calc(100svh-44px)] min-h-[600px] bg-[#D6FFD6] flex flex-col relative overflow-hidden rounded-[17px]">
        <div className="pt-[120px] xl:pt-[153px] px-[48px] xl:px-[96px] shrink-0">
          <h2 className="w-[276px] h-[72px] text-[48px] font-semibold text-[#007A00] leading-none tracking-normal font-sans">
            Selaraskan
          </h2>
          <p className="w-[317px] h-[24px] text-[#666666] text-[16px] font-medium leading-normal mt-0 font-sans">
            teknologi dan alam dalam satu sistem.
          </p>
        </div>

        <div className="relative mt-[34px] flex-1 min-h-0">
          <div className="absolute left-[-365px] top-0 w-[883px] h-[737px] overflow-hidden">
            <Image
              src="/Images/mockupLaptop.png"
              alt="NYAWIT laptop mockup preview"
              width={2000}
              height={1500}
              className="w-[883px] h-[737px] object-cover object-center"
              priority
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
