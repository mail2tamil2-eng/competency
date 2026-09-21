import svgPaths from "./svg-kfvkeiehb3";

function Play() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Play">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Play">
          <path d="M6 3L20 12L6 21V3Z" fill="var(--fill-0, white)" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Container2() {
  return (
    <div className="relative rounded-[10px] shrink-0 size-[40px]" data-name="Container" style={{ backgroundImage: "linear-gradient(135deg, rgb(255, 137, 4) 0%, rgb(245, 73, 0) 100%)" }}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Play />
      </div>
    </div>
  );
}

function H() {
  return (
    <div className="h-[28px] relative shrink-0 w-full" data-name="h2">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[18px] text-white top-[-1px] whitespace-nowrap">Information Security Management System 2</p>
    </div>
  );
}

function P() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="p">
      <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[16px] min-h-px min-w-px not-italic relative text-[#99a1af] text-[12px]">SCORM Player Preview</p>
    </div>
  );
}

function Container3() {
  return (
    <div className="flex-[1_0_0] h-[44px] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <H />
        <P />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[44px] relative shrink-0 w-[425.422px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container2 />
        <Container3 />
      </div>
    </div>
  );
}

function Menu() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Menu">
      <div className="absolute bottom-1/2 left-[16.67%] right-[16.67%] top-1/2" data-name="Vector">
        <div className="absolute inset-[-0.83px_-6.25%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 1.66667">
            <path d="M0.833333 0.833333H14.1667" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-3/4 left-[16.67%] right-[16.67%] top-1/4" data-name="Vector">
        <div className="absolute inset-[-0.83px_-6.25%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 1.66667">
            <path d="M0.833333 0.833333H14.1667" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-1/4 left-[16.67%] right-[16.67%] top-3/4" data-name="Vector">
        <div className="absolute inset-[-0.83px_-6.25%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 1.66667">
            <path d="M0.833333 0.833333H14.1667" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="relative rounded-[10px] shrink-0 size-[40px]" data-name="button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[10px] px-[10px] relative size-full">
        <Menu />
      </div>
    </div>
  );
}

function HelpCircle() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="HelpCircle">
      <div className="absolute inset-[8.33%]" data-name="Vector">
        <div className="absolute inset-[-5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.3333 18.3333">
            <path d={svgPaths.p147ca400} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[29.15%_37.83%_45.83%_37.88%]" data-name="Vector">
        <div className="absolute inset-[-16.65%_-17.15%_-16.66%_-17.16%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.52523 6.67062">
            <path d={svgPaths.p3f45e600} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[29.17%] left-1/2 right-[49.96%] top-[70.83%]" data-name="Vector">
        <div className="absolute inset-[-0.83px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.675 1.66667">
            <path d="M0.833333 0.833333H0.841667" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="relative rounded-[10px] shrink-0 size-[40px]" data-name="button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[10px] px-[10px] relative size-full">
        <HelpCircle />
      </div>
    </div>
  );
}

function LogOut() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="LogOut">
      <div className="absolute inset-[12.5%_62.5%_12.5%_12.5%]" data-name="Vector">
        <div className="absolute inset-[-5.56%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.66667 16.6667">
            <path d={svgPaths.p297e5680} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[29.17%_12.5%_29.17%_66.67%]" data-name="Vector">
        <div className="absolute inset-[-10%_-20%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.83333 10">
            <path d={svgPaths.p6680d80} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-1/2 left-[37.5%] right-[12.5%] top-1/2" data-name="Vector">
        <div className="absolute inset-[-0.83px_-8.33%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.6667 1.66667">
            <path d="M10.8333 0.833333H0.833333" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <button className="cursor-pointer flex-[1_0_0] h-[40px] min-h-px min-w-px relative rounded-[10px]" data-name="button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[10px] px-[10px] relative size-full">
        <LogOut />
      </div>
    </button>
  );
}

function Container4() {
  return (
    <div className="h-[40px] relative shrink-0 w-[136px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Button />
        <Button1 />
        <Button2 />
      </div>
    </div>
  );
}

function Div() {
  return (
    <div className="bg-[rgba(0,0,0,0.5)] h-[77px] relative shrink-0 w-full" data-name="div">
      <div aria-hidden="true" className="absolute border-[#364153] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between pb-px px-[16px] relative size-full">
          <Container1 />
          <Container4 />
        </div>
      </div>
    </div>
  );
}

function Play1() {
  return (
    <div className="relative shrink-0 size-[64px]" data-name="Play">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 64 64">
        <g id="Play">
          <path d="M16 8L53.3333 32L16 56V8Z" fill="var(--fill-0, white)" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5.33333" />
        </g>
      </svg>
    </div>
  );
}

function Container7() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[184.94px] rounded-[33554400px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] size-[128px] top-0" data-name="Container" style={{ backgroundImage: "linear-gradient(135deg, rgb(255, 137, 4) 0%, rgb(245, 73, 0) 100%)" }}>
      <Play1 />
    </div>
  );
}

function H1() {
  return (
    <div className="absolute content-stretch flex h-[32px] items-start left-0 top-[152px] w-[497.891px]" data-name="h3">
      <p className="font-['Inter:Bold',sans-serif] font-bold leading-[32px] not-italic relative shrink-0 text-[24px] text-center text-white whitespace-nowrap">Information Security Management System 2</p>
    </div>
  );
}

function P1() {
  return (
    <div className="absolute h-[24px] left-0 top-[192px] w-[497.891px]" data-name="p">
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-[248.97px] not-italic text-[#99a1af] text-[16px] text-center top-[-2px] whitespace-nowrap">SCORM Package Preview</p>
    </div>
  );
}

function Container6() {
  return (
    <div className="h-[216px] relative shrink-0 w-[497.891px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container7 />
        <H1 />
        <P1 />
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="absolute content-stretch flex h-[648px] items-center justify-center left-0 pr-[0.016px] top-0 w-[1152px]" data-name="Container" style={{ backgroundImage: "linear-gradient(150.642deg, rgb(30, 41, 57) 0%, rgb(16, 24, 40) 50%, rgb(0, 0, 0) 100%)" }}>
      <Container6 />
    </div>
  );
}

function Button3() {
  return <div className="absolute bg-[rgba(0,0,0,0.2)] h-[648px] left-0 top-0 w-[1152px]" data-name="button" />;
}

function P2() {
  return (
    <div className="content-stretch flex h-[20px] items-start relative shrink-0 w-full" data-name="p">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-white whitespace-nowrap">SCORM 1.2 / 2004</p>
    </div>
  );
}

function Container8() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.6)] content-stretch flex flex-col h-[36px] items-start left-[16px] pt-[8px] px-[16px] rounded-[10px] top-[16px] w-[145.891px]" data-name="Container">
      <P2 />
    </div>
  );
}

function Div1() {
  return (
    <div className="bg-black h-[648px] relative shrink-0 w-full" data-name="div">
      <Container5 />
      <Button3 />
      <Container8 />
    </div>
  );
}

function Span() {
  return (
    <div className="h-[16px] relative shrink-0 w-[26.422px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Consolas:Regular',sans-serif] leading-[16px] left-0 not-italic text-[12px] text-white top-0 whitespace-nowrap">0:00</p>
      </div>
    </div>
  );
}

function Container11() {
  return <div className="bg-gradient-to-r from-[#2b7fff] h-[6px] shrink-0 to-[#4f39f6] w-full" data-name="Container" />;
}

function Container10() {
  return (
    <div className="bg-[#364153] flex-[1_0_0] h-[6px] min-h-px min-w-px relative rounded-[33554400px]" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pr-[1043.156px] relative size-full">
          <Container11 />
        </div>
      </div>
    </div>
  );
}

function Span1() {
  return (
    <div className="h-[16px] relative shrink-0 w-[26.422px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Consolas:Regular',sans-serif] leading-[16px] left-0 not-italic text-[#99a1af] text-[12px] top-0 whitespace-nowrap">3:00</p>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex gap-[12px] h-[16px] items-center relative shrink-0 w-full" data-name="Container">
      <Span />
      <Container10 />
      <Span1 />
    </div>
  );
}

function Play2() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Play">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Play">
          <path d={svgPaths.p262abc00} fill="var(--fill-0, white)" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Button4() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[40px]" data-name="button">
      <Play2 />
    </div>
  );
}

function RotateCcw() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="RotateCcw">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="RotateCcw">
          <path d={svgPaths.p2110f1c0} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M2.5 2.5V6.66667H6.66667" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Button5() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[40px]" data-name="button">
      <RotateCcw />
    </div>
  );
}

function SkipBack() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SkipBack">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="SkipBack">
          <path d={svgPaths.p35f5ae00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M4.16667 15.8333V4.16667" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Button6() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[40px]" data-name="button">
      <SkipBack />
    </div>
  );
}

function SkipForward() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SkipForward">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="SkipForward">
          <path d={svgPaths.p11aea120} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M15.8333 4.16667V15.8333" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Button7() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[40px]" data-name="button">
      <SkipForward />
    </div>
  );
}

function Volume() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Volume2">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Volume2">
          <path d={svgPaths.p19cded00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p2ed10d00} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p1e708580} id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Button8() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[40px]" data-name="button">
      <Volume />
    </div>
  );
}

function Button9() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] content-stretch flex h-[40px] items-center justify-center px-[12px] relative rounded-[10px] shrink-0 w-[60px]" data-name="button">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-center text-white whitespace-nowrap">1x</p>
    </div>
  );
}

function Button10() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] content-stretch flex h-[40px] items-center justify-center px-[12px] relative rounded-[10px] shrink-0 w-[60px]" data-name="button">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-center text-white whitespace-nowrap">CC</p>
    </div>
  );
}

function Button11() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] content-stretch flex h-[40px] items-center justify-center px-[12px] relative rounded-[10px] shrink-0 w-[60px]" data-name="button">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-center text-white whitespace-nowrap">1x</p>
    </div>
  );
}

function Container13() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-start flex flex-wrap gap-[0px_8px] items-start relative">
        <Button4 />
        <Button5 />
        <Button6 />
        <Button7 />
        <Button8 />
        <Button9 />
        <Button10 />
        <Button11 />
      </div>
    </div>
  );
}

function ChevronLeft() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="ChevronLeft">
      <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.66667 11.6667">
            <path d={svgPaths.p3a0d2780} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Button12() {
  return (
    <div className="opacity-30 relative rounded-[4px] shrink-0 size-[28px]" data-name="button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[4px] px-[4px] relative size-full">
        <ChevronLeft />
      </div>
    </div>
  );
}

function Span2() {
  return (
    <div className="flex-[1_0_0] h-[20px] min-h-px min-w-px relative" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="flex-[1_0_0] font-['Inter:Bold',sans-serif] font-bold leading-[20px] min-h-px min-w-px not-italic relative text-[14px] text-center text-white">01 / 8</p>
      </div>
    </div>
  );
}

function ChevronRight() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="ChevronRight">
      <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.66667 11.6667">
            <path d={svgPaths.p324d0480} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Button13() {
  return (
    <div className="relative rounded-[4px] shrink-0 size-[28px]" data-name="button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[4px] px-[4px] relative size-full">
        <ChevronRight />
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="flex-[1_0_0] h-[44px] min-h-px min-w-px relative rounded-[10px]" data-name="Container" style={{ backgroundImage: "linear-gradient(163.443deg, rgb(255, 137, 4) 0%, rgb(245, 73, 0) 100%)" }}>
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center px-[12px] relative size-full">
          <Button12 />
          <Span2 />
          <Button13 />
        </div>
      </div>
    </div>
  );
}

function Maximize() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Maximize">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Maximize">
          <path d={svgPaths.p392de000} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p12d23980} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p28a5b80} id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p3aee1b80} id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Button14() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] relative rounded-[10px] shrink-0 size-[40px]" data-name="button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Maximize />
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="h-[44px] relative shrink-0 w-[196px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Container15 />
        <Button14 />
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex h-[44px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container13 />
      <Container14 />
    </div>
  );
}

function Div2() {
  return (
    <div className="bg-[#1e2939] h-[109px] relative shrink-0 w-full" data-name="div">
      <div aria-hidden="true" className="absolute border-[#364153] border-solid border-t inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col gap-[16px] items-start pt-[17px] px-[16px] relative size-full">
        <Container9 />
        <Container12 />
      </div>
    </div>
  );
}

export default function Container() {
  return (
    <div className="bg-[#101828] content-stretch flex flex-col items-start overflow-clip relative rounded-[16px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] size-full" data-name="Container">
      <Div />
      <Div1 />
      <Div2 />
    </div>
  );
}