import Image from "next/image";

export default function LoginBrandingPanel() {
  return (
    <aside className="relative hidden lg:block p-[22px] min-h-svh overflow-hidden">
      <div className="w-full h-[calc(100svh-44px)] min-h-[600px] bg-[#D6FFD6]/60 flex flex-col relative overflow-hidden rounded-[17px]">
        <div className="relative pt-[120px] xl:pt-[153px] px-[48px] xl:px-[96px] shrink-0">
          <h2 className="w-[276px] h-[58px] text-[48px] font-semibold text-[#02CC01] leading-none tracking-normal font-sans">
            Selaraskan
          </h2>
          <p className="w-[317px] h-[24px] text-[#666666] text-[16px] font-medium leading-normal mt-0 font-sans">
            teknologi dan alam dalam satu sistem.
          </p>
        </div>

        <div className="relative mt-[34px] flex-1 min-h-0">
          {/* Laptop mirrors the Figma spec (670x979 card: right edge at 97%
              of card width, top at area start = y 283, height 921).
              Height is 132% of the visible area so the cropped fraction
              always matches Figma (area shows the top 76% of the laptop:
              dashboard readable, keyboard bleeds off the bottom).
              Right edge anchored at 3% so it holds at any viewport. */}
          <div className="absolute top-0 right-[25%] h-[142%] aspect-[1104/921] overflow-hidden">
            <Image
              src="/Images/mockupLaptop.png"
              alt="NYAWIT laptop mockup preview"
              width={2000}
              height={1500}
              className="h-full w-full object-cover object-center"
              priority
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
