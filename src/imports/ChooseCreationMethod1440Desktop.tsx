import svgPaths from "./svg-abzzejtof1";
import imgRectangle1393 from "figma:asset/1b7304b285d08c0f8b29f8fc61ad6621680532e7.png";
import imgNovactechLogoR1 from "figma:asset/37a1c26d1170886639ecce5dc0f5958ff5796f24.png";
import { imgGroup, imgGroup1, imgGroup2 } from "./svg-9n62g";

function Group5() {
  return (
    <div className="absolute inset-[35.9%_-0.09%_37.18%_97.85%]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 10.7694">
        <g id="Group 21861">
          <path d={svgPaths.p31506f40} id="Shape" stroke="var(--stroke-0, #151D48)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <g id="Size" />
        </g>
      </svg>
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute contents inset-[29.17%_-0.09%_30.45%_82.8%]">
      <Group5 />
      <div className="absolute flex flex-col font-['Inter:Medium',sans-serif] font-medium inset-[29.17%_4.67%_30.45%_82.8%] justify-center leading-[0] not-italic text-[#151d48] text-[16px]">
        <p className="leading-[24px] whitespace-pre-wrap">Dheva</p>
      </div>
    </div>
  );
}

function Group7() {
  return (
    <div className="absolute contents left-[383px] top-0">
      <div className="absolute left-[383px] rounded-[20.193px] size-[40px] top-0">
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[20.193px]">
          <img alt="" className="absolute h-[150.98%] left-0 max-w-none top-[-8.56%] w-full" src={imgRectangle1393} />
        </div>
      </div>
      <Group6 />
    </div>
  );
}

function ClarityNotificationLine() {
  return (
    <div className="absolute h-[19.994px] left-[338px] top-[8.28px] w-[20px]" data-name="clarity:notification-line">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 19.9945">
        <g clipPath="url(#clip0_2_324)" id="clarity:notification-line">
          <path d={svgPaths.pdee5580} fill="var(--fill-0, #FFA412)" id="Vector" />
          <path d={svgPaths.p3a939400} fill="var(--fill-0, #FFA412)" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_2_324">
            <rect fill="white" height="19.9945" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Notifications1() {
  return (
    <div className="absolute contents left-[328px] top-0" data-name="Notifications">
      <div className="absolute bg-[#fffaf1] border border-[#fcdca8] border-solid left-[328px] rounded-[20px] size-[40px] top-0" />
      <ClarityNotificationLine />
    </div>
  );
}

function Notifications() {
  return (
    <div className="absolute contents left-[328px] top-0" data-name="Notifications">
      <Notifications1 />
      <div className="absolute bottom-3/4 left-[66.54%] right-[31.59%] top-0" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <path d={svgPaths.p46c6500} fill="var(--fill-0, #EB5757)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Menu() {
  return (
    <div className="absolute contents left-[328px] top-0" data-name="menu">
      <Group7 />
      <Notifications />
    </div>
  );
}

function PrimeSearch() {
  return (
    <div className="absolute left-[2px] size-[26px] top-[2.31px]" data-name="prime:search">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 26 26">
        <g id="prime:search">
          <path d={svgPaths.p1259900} fill="var(--fill-0, #979797)" id="Vector" />
          <path d={svgPaths.p184ecf0} fill="var(--fill-0, #979797)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Magnifier() {
  return (
    <div className="h-[31px] overflow-clip relative shrink-0 w-[30px]" data-name="magnifier">
      <PrimeSearch />
    </div>
  );
}

function Frame1() {
  return (
    <div className="-translate-y-1/2 absolute bg-[#f2f2f2] content-stretch flex gap-[5px] h-[40px] items-center left-[-581px] p-[6px] rounded-[55px] top-1/2 w-[312px]">
      <Magnifier />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#8e8e93] text-[16px]">Search here...</p>
    </div>
  );
}

function Frame() {
  return (
    <div className="-translate-y-1/2 absolute h-[40px] left-0 top-1/2 w-[535px]" data-name="Frame">
      <Menu />
      <Frame1 />
    </div>
  );
}

function TopRight() {
  return (
    <div className="absolute h-[44px] left-[581px] top-0 w-[550px]" data-name="Top right">
      <Frame />
    </div>
  );
}

function Taps() {
  return (
    <div className="absolute h-[44px] left-[25px] top-[18px] w-[1133px]" data-name="taps">
      <TopRight />
    </div>
  );
}

function TopBar() {
  return (
    <div className="absolute bg-white h-[80px] left-[259px] top-0 w-[1181px]" data-name="top bar">
      <div aria-hidden="true" className="absolute border border-[#e2e2e2] border-solid inset-[-1px] pointer-events-none" />
      <Taps />
    </div>
  );
}

function IconamoonArrowRight2Light() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="iconamoon:arrow-right-2-light">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="iconamoon:arrow-right-2-light">
          <path d="M10 17L15 12L10 7" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function StartButton() {
  return (
    <div className="-translate-x-1/2 absolute bg-[#f48120] bottom-[25px] content-stretch flex gap-[5px] h-[45px] items-center justify-center left-1/2 px-[15px] py-[4px] rounded-[10px] w-[260px]" data-name="Start Button">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[32px] not-italic relative shrink-0 text-[14px] text-white">Start with Documents</p>
      <IconamoonArrowRight2Light />
    </div>
  );
}

function Layer() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[64px] left-[calc(50%+0.5px)] top-[calc(50%+8px)] w-[69px]" data-name="Layer_1">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 69 64">
        <g clipPath="url(#clip0_2_308)" id="Layer_1">
          <path d={svgPaths.p2559b100} fill="var(--fill-0, #0AAA98)" id="Vector" />
          <path d={svgPaths.p32c037c0} fill="var(--fill-0, white)" id="Vector_2" />
          <path d={svgPaths.p3c00b980} fill="var(--fill-0, #004A54)" id="Vector_3" />
          <path d={svgPaths.p1743ef00} fill="var(--fill-0, #004A54)" id="Vector_4" />
          <path d={svgPaths.p29b83800} fill="var(--fill-0, #FEFCF7)" id="Vector_5" />
          <path d={svgPaths.p2c9d8100} fill="var(--fill-0, #E4E7F8)" id="Vector_6" />
          <g id="Group">
            <path d={svgPaths.pb7ac00} fill="var(--fill-0, #F38020)" id="Vector_7" />
            <path d={svgPaths.p3e127000} fill="var(--fill-0, #F38020)" id="Vector_8" />
          </g>
        </g>
        <defs>
          <clipPath id="clip0_2_308">
            <rect fill="white" height="64" width="69" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Methord() {
  return (
    <div className="absolute left-[25px] overflow-clip rounded-[80px] size-[80px] top-[25.85px]" data-name="Methord 1">
      <Layer />
    </div>
  );
}

function Component() {
  return (
    <div className="absolute bg-white bottom-[345px] h-[427px] left-[363px] rounded-[16px] w-[310px]" data-name="2">
      <div aria-hidden="true" className="absolute border border-[#d9d9d9] border-solid inset-[-0.5px] pointer-events-none rounded-[16.5px] shadow-[0px_4px_20px_0px_rgba(195,195,195,0.5)]" />
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[32px] left-[calc(50%-130px)] not-italic text-[#3b3b3b] text-[20px] top-[126px]">PPT/PDF to SCORM</p>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[56px] leading-[20px] left-[calc(50%-130px)] not-italic text-[14px] text-black top-[169px] w-[260px] whitespace-pre-wrap">Convert your existing PowerPoint or PDF files directly into SCORM packages</p>
      <ul className="absolute block font-['Inter:Regular','Noto_Sans:Regular',sans-serif] font-normal h-[102px] leading-[0] left-[calc(50%-130px)] list-disc not-italic text-[14px] text-black top-[238px] w-[205px] whitespace-pre-wrap">
        <li className="mb-0 ms-[21px]">
          <span className="leading-[22px]">{`Quick conversion `}</span>
        </li>
        <li className="mb-0 ms-[21px]">
          <span className="leading-[22px]">{`Upload PPT or PDF `}</span>
        </li>
        <li className="ms-[21px]">
          <span className="leading-[22px]">Auto-generate SCORM</span>
        </li>
      </ul>
      <StartButton />
      <div className="-translate-x-1/2 absolute bg-[#f7f7f7] left-[calc(50%-90px)] rounded-[41px] size-[80px] top-[30.15px]" />
      <Methord />
    </div>
  );
}

function IconamoonArrowRight2Light1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="iconamoon:arrow-right-2-light">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="iconamoon:arrow-right-2-light">
          <path d="M10 17L15 12L10 7" id="Vector" stroke="var(--stroke-0, #484848)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function StartButton1() {
  return (
    <div className="-translate-x-1/2 absolute bottom-[25px] content-stretch flex gap-[5px] h-[45px] items-center justify-center left-1/2 px-[15px] py-[4px] rounded-[10px] w-[260px]" data-name="Start Button">
      <div aria-hidden="true" className="absolute border border-[#d5d5d5] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[32px] not-italic relative shrink-0 text-[#484848] text-[14px]">Build Custom Course</p>
      <IconamoonArrowRight2Light1 />
    </div>
  );
}

function Component9M29OhTif() {
  return (
    <div className="absolute contents inset-0" data-name="9m29OH.tif">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 64.0002 64.0027">
        <g id="Group">
          <path d={svgPaths.p24d58400} fill="var(--fill-0, #474747)" id="Vector" />
          <g id="Group_2">
            <path d={svgPaths.p57fe570} fill="var(--fill-0, #0AAA98)" id="Vector_2" />
            <path d={svgPaths.p32039f40} fill="var(--fill-0, #0AAA98)" id="Vector_3" />
            <path d={svgPaths.p24989f00} fill="var(--fill-0, #0AAA98)" id="Vector_4" />
            <path d={svgPaths.p516f100} fill="var(--fill-0, #2A2A2A)" id="Vector_5" />
            <g id="Group_3">
              <g id="Group_4">
                <path d={svgPaths.p3c2dc000} fill="var(--fill-0, white)" id="Union" />
                <g clipPath="url(#clip0_2_258)" id="OBJECTS">
                  <path d={svgPaths.p3459c080} fill="var(--fill-0, #F3D751)" id="Vector_6" />
                  <path d={svgPaths.p3616de00} fill="var(--fill-0, #EBBC3D)" id="Vector_7" />
                  <path d={svgPaths.p29c15f00} fill="var(--fill-0, #EBBC3D)" id="Vector_8" />
                  <path d={svgPaths.p2330d600} fill="var(--fill-0, #EBBC3D)" id="Vector_9" />
                  <path d={svgPaths.p13bb5680} fill="var(--fill-0, #EBBC3D)" id="Vector_10" />
                  <path d={svgPaths.p2394bc80} fill="var(--fill-0, #E48E31)" id="Vector_11" />
                  <path d={svgPaths.p27929800} fill="var(--fill-0, #E48E31)" id="Vector_12" />
                  <path d={svgPaths.p14b4ed80} fill="var(--fill-0, #E48E31)" id="Vector_13" />
                  <path d={svgPaths.pcbf1000} fill="var(--fill-0, #EBBC3D)" id="Vector_14" />
                  <path d={svgPaths.p309ee800} fill="var(--fill-0, #E48E31)" id="Vector_15" />
                  <path d={svgPaths.p237af380} fill="var(--fill-0, #EBBC3D)" id="Vector_16" />
                </g>
              </g>
              <g clipPath="url(#clip1_2_258)" id="OBJECTS_2">
                <path d={svgPaths.p2bb2e80} fill="var(--fill-0, #0AAA98)" id="Vector_17" />
                <path d={svgPaths.p3c875980} fill="var(--fill-0, #28C3B1)" id="Vector_18" />
                <path d={svgPaths.p28d9c300} fill="var(--fill-0, #EBB79E)" id="Vector_19" />
                <path d={svgPaths.p19e8f6f0} fill="var(--fill-0, #F0CCBE)" id="Vector_20" />
                <path d={svgPaths.p13d78d00} fill="var(--fill-0, #3BBDAE)" id="Vector_21" />
                <path d={svgPaths.p19909200} fill="var(--fill-0, #80D7F4)" id="Vector_22" />
              </g>
              <path d={svgPaths.p1807b880} fill="var(--fill-0, white)" id="Vector_23" />
              <path d={svgPaths.p1443f600} fill="var(--fill-0, white)" id="Vector_24" />
              <path d={svgPaths.p1dc99500} fill="var(--fill-0, white)" id="Vector_25" />
              <g id="Group_5">
                <path d={svgPaths.pd538bf0} fill="url(#paint0_linear_2_258)" id="Vector_26" />
                <path d={svgPaths.p3d462180} fill="url(#paint1_linear_2_258)" id="Vector_27" />
                <path d={svgPaths.p29147400} fill="var(--fill-0, #FEFEFE)" id="Vector_28" />
                <path d={svgPaths.pe278600} fill="var(--fill-0, #FEFEFE)" id="Vector_29" />
                <path d={svgPaths.p371eec00} fill="var(--fill-0, #FEFEFE)" id="Vector_30" />
                <path d={svgPaths.p1e6f6100} fill="var(--fill-0, #FEFEFE)" id="Vector_31" />
              </g>
            </g>
            <g id="Group_6">
              <path d={svgPaths.p1d09eb00} fill="var(--fill-0, #E3E9EE)" id="Vector_32" />
              <path d={svgPaths.p1f17b900} fill="var(--fill-0, #E4E7F8)" id="Vector_33" />
            </g>
          </g>
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_2_258" x1="17.4621" x2="51.1893" y1="28.806" y2="28.806">
            <stop stopColor="#F38020" />
            <stop offset="1" stopColor="#FBD108" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_2_258" x1="12.7987" x2="30.2594" y1="28.8034" y2="28.8034">
            <stop stopColor="#F38020" />
            <stop offset="1" stopColor="#FBD108" />
          </linearGradient>
          <clipPath id="clip0_2_258">
            <rect fill="white" height="16" transform="matrix(-1 0 0 1 32.9987 6)" width="10" />
          </clipPath>
          <clipPath id="clip1_2_258">
            <rect fill="white" height="12" transform="translate(35.9985 9)" width="6" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Layer1() {
  return (
    <div className="-translate-x-1/2 absolute left-1/2 overflow-clip size-[64px] top-[18px]" data-name="Layer_1">
      <Component9M29OhTif />
    </div>
  );
}

function Methord1() {
  return (
    <div className="absolute left-[25px] overflow-clip rounded-[70px] size-[80px] top-[25px]" data-name="Methord 2">
      <Layer1 />
    </div>
  );
}

function Component1() {
  return (
    <div className="absolute bg-white h-[427px] left-[695px] rounded-[16px] top-[188px] w-[310px]" data-name="5">
      <div aria-hidden="true" className="absolute border border-[#d9d9d9] border-solid inset-[-0.5px] pointer-events-none rounded-[16.5px]" />
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[32px] left-[calc(50%-130px)] not-italic text-[#3b3b3b] text-[20px] top-[126px]">Custom Course Creation</p>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[57px] leading-[20px] left-[calc(50%-130px)] not-italic text-[14px] text-black top-[169px] w-[260px] whitespace-pre-wrap">Create rich SCORM content with multiple modules and interactive elements</p>
      <StartButton1 />
      <div className="-translate-x-1/2 absolute bg-[#f7f7f7] left-[calc(50%-90px)] rounded-[41px] size-[80px] top-[25.15px]" />
      <Methord1 />
      <ul className="absolute block font-['Inter:Regular','Noto_Sans:Regular',sans-serif] font-normal h-[102px] leading-[0] left-[calc(50%-130px)] list-disc not-italic text-[14px] text-black top-[238px] w-[205px] whitespace-pre-wrap">
        <li className="mb-0 ms-[21px]">
          <span className="leading-[22px]">{`Video modules `}</span>
        </li>
        <li className="mb-0 ms-[21px]">
          <span className="leading-[22px]">{`PDF documents `}</span>
        </li>
        <li className="mb-0 ms-[21px]">
          <span className="leading-[22px]">{`Audio narration `}</span>
        </li>
        <li className="ms-[21px]">
          <span className="leading-[22px]">Interactive quizzes</span>
        </li>
      </ul>
    </div>
  );
}

function Layer2() {
  return (
    <div className="absolute left-[6px] size-[64px] top-[16px]" data-name="Layer_1">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 64 64">
        <g clipPath="url(#clip0_2_239)" id="Layer_1">
          <path d={svgPaths.pa54300} fill="var(--fill-0, #0AAA98)" id="Vector" />
          <path d={svgPaths.p1bbefd80} fill="var(--fill-0, #CDD6DC)" id="Vector_2" />
          <path d={svgPaths.p1057e000} fill="var(--fill-0, #E3E9EE)" id="Vector_3" />
          <path d={svgPaths.p1ddf0700} fill="var(--fill-0, #CDD6DC)" id="Vector_4" />
          <path d={svgPaths.p208f9580} fill="var(--fill-0, #CDD6DC)" id="Vector_5" />
          <path d={svgPaths.p2f7e500} fill="var(--fill-0, #B2C0C8)" id="Vector_6" />
          <path d={svgPaths.p2a38680} fill="var(--fill-0, #B2C0C8)" id="Vector_7" />
          <path d={svgPaths.p3ee4c970} fill="var(--fill-0, #CDD6DC)" id="Vector_8" />
          <path d={svgPaths.p1d46be00} fill="var(--fill-0, #E3E9EE)" id="Vector_9" />
          <path d={svgPaths.p1a928200} fill="var(--fill-0, #CDD6DC)" id="Vector_10" />
          <path d={svgPaths.p108d2500} fill="var(--fill-0, #CDD6DC)" id="Vector_11" />
          <path d={svgPaths.p185e8070} fill="var(--fill-0, #154880)" id="Vector_12" />
          <path d={svgPaths.p2f99a580} fill="var(--fill-0, #F48120)" id="Vector_13" />
          <path d={svgPaths.p3bf1d500} fill="var(--fill-0, #F48120)" id="Vector_14" />
          <g id="Group">
            <path d={svgPaths.p3a1cbb00} fill="var(--fill-0, #E3E9EE)" id="Vector_15" />
            <path d={svgPaths.p24298e00} fill="var(--fill-0, #E3E9EE)" id="Vector_16" />
          </g>
        </g>
        <defs>
          <clipPath id="clip0_2_239">
            <rect fill="white" height="64" width="64" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Method() {
  return (
    <div className="absolute left-[25px] overflow-clip rounded-[90px] size-[80px] top-[25px]" data-name="Method 3">
      <Layer2 />
    </div>
  );
}

function IconamoonArrowRight2Light2() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="iconamoon:arrow-right-2-light">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="iconamoon:arrow-right-2-light">
          <path d="M10 17L15 12L10 7" id="Vector" stroke="var(--stroke-0, #484848)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function StartButton2() {
  return (
    <div className="-translate-x-1/2 absolute bottom-[25px] content-stretch flex gap-[5px] h-[45px] items-center justify-center left-1/2 px-[15px] py-[4px] rounded-[10px] w-[260px]" data-name="Start Button">
      <div aria-hidden="true" className="absolute border border-[#d5d5d5] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[32px] not-italic relative shrink-0 text-[#484848] text-[14px]">Generate a Course</p>
      <IconamoonArrowRight2Light2 />
    </div>
  );
}

function Component2() {
  return (
    <div className="absolute bg-white h-[427px] left-[1027px] rounded-[16px] top-[188px] w-[310px]" data-name="6">
      <div aria-hidden="true" className="absolute border border-[#d9d9d9] border-solid inset-[-0.5px] pointer-events-none rounded-[16.5px]" />
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[32px] left-[calc(50%-130px)] not-italic text-[#3b3b3b] text-[20px] top-[126px]">Generate course using Ai</p>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal h-[57px] leading-[20px] left-[calc(50%-130px)] not-italic text-[14px] text-black top-[169px] w-[260px] whitespace-pre-wrap">Move beyond the hype and gain the practical skills to lead the next generation of innovation.</p>
      <div className="-translate-x-1/2 absolute bg-[#f7f7f7] left-[calc(50%-90px)] rounded-[41px] size-[80px] top-[25.15px]" />
      <Method />
      <StartButton2 />
    </div>
  );
}

function Group9() {
  return (
    <div className="absolute contents left-[363px] top-[188px]">
      <Component />
      <Component1 />
      <Component2 />
    </div>
  );
}

function CarbonDashboardReference() {
  return (
    <div className="relative shrink-0 size-[25px]" data-name="carbon:dashboard-reference">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
        <g id="carbon:dashboard-reference">
          <path d={svgPaths.p3984ae80} fill="var(--fill-0, #F48120)" id="Vector" />
          <path d={svgPaths.p113b4100} fill="var(--fill-0, black)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[16.67%_12.5%_12.5%_16.67%]" data-name="Group">
      <div className="absolute inset-[-4.41%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.2708 19.2708">
          <g id="Group">
            <path d={svgPaths.p344bef00} id="Vector" stroke="var(--stroke-0, #F48120)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5625" />
            <path d={svgPaths.p35ba5b00} id="Vector_2" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5625" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function IconoirMediaVideoList() {
  return (
    <div className="overflow-clip relative shrink-0 size-[25px]" data-name="iconoir:media-video-list">
      <Group />
    </div>
  );
}

function Group1() {
  return (
    <div className="col-1 h-[28.997px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0.629px_0.658px] mask-size-[29.102px_27.678px] ml-[-2.16%] mt-[-2.38%] relative row-1 w-[30.362px]" data-name="Group" style={{ maskImage: `url('${imgGroup}')` }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30.362 28.9971">
        <g id="Group">
          <path d={svgPaths.p371c900} fill="url(#paint0_linear_1_70)" id="Vector" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_70" x1="14.9067" x2="15.5405" y1="0.574334" y2="28.6012">
            <stop stopColor="#F05A28" />
            <stop offset="1" stopColor="#F48120" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function ClipPathGroup() {
  return (
    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-0 mt-[0.2%] place-items-start relative row-1" data-name="Clip path group">
      <Group1 />
    </div>
  );
}

function Group2() {
  return (
    <div className="col-1 h-[17.753px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0.385px_0.402px] mask-size-[17.804px_16.946px] ml-[-2.16%] mt-[-2.37%] relative row-1 w-[18.575px]" data-name="Group" style={{ maskImage: `url('${imgGroup1}')` }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.5752 17.7529">
        <g id="Group">
          <path d={svgPaths.pd5905f2} fill="url(#paint0_linear_1_187)" id="Vector" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_187" x1="9.00295" x2="9.39557" y1="0.303165" y2="17.6668">
            <stop stopColor="#F05A28" />
            <stop offset="1" stopColor="#F48120" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function ClipPathGroup1() {
  return (
    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[16.51%] mt-[38.63%] place-items-start relative row-1" data-name="Clip path group">
      <Group2 />
    </div>
  );
}

function Group3() {
  return (
    <div className="col-1 h-[18.506px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0.404px_0.393px] mask-size-[17.452px_17.717px] ml-[-2.32%] mt-[-2.22%] relative row-1 w-[18.257px]" data-name="Group" style={{ maskImage: `url('${imgGroup2}')` }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.2572 18.5064">
        <g id="Group">
          <path d={svgPaths.p5cc2e00} fill="url(#paint0_linear_2_230)" id="Vector" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_2_230" x1="8.97162" x2="9.37068" y1="0.423373" y2="18.0723">
            <stop stopColor="#F05A28" />
            <stop offset="1" stopColor="#F48120" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function ClipPathGroup2() {
  return (
    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[32.07%] mt-[36.56%] place-items-start relative row-1" data-name="Clip path group">
      <Group3 />
    </div>
  );
}

function Group8() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <ClipPathGroup />
      <ClipPathGroup1 />
      <div className="col-1 flex h-[27.809px] items-center justify-center ml-[51.84px] mt-0 relative row-1 w-[4.436px]">
        <div className="flex-none h-[27.73px] rotate-[-1.3deg] w-[3.807px]">
          <div className="relative size-full" data-name="Vector">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3.80723 27.7302">
              <path d={svgPaths.p3cff5680} fill="url(#paint0_linear_1_68)" id="Vector" />
              <defs>
                <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_68" x1="2.04888" x2="2.04888" y1="-0.0584602" y2="27.7042">
                  <stop stopColor="#F05A28" />
                  <stop offset="1" stopColor="#F48120" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
      <div className="col-1 h-[27.663px] ml-[52.47px] mt-[0.07px] relative row-1 w-[3.179px]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="Vector" />
        </svg>
      </div>
      <ClipPathGroup2 />
      <div className="col-1 h-[27.84px] ml-[86.87px] mt-[0.04px] relative row-1 w-[20.935px]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.9346 27.8396">
          <path d={svgPaths.p3c39da00} fill="var(--fill-0, #154880)" id="Vector" />
        </svg>
      </div>
      <div className="col-1 h-[25.328px] ml-[109.42px] mt-[2.21px] relative row-1 w-[9.674px]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.67369 25.3285">
          <path d={svgPaths.p7a9d000} fill="var(--fill-0, #154880)" id="Vector" />
        </svg>
      </div>
      <div className="col-1 h-[19.86px] ml-[122.47px] mt-[8.02px] relative row-1 w-[15.708px]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.7078 19.8603">
          <path d={svgPaths.p21239700} fill="var(--fill-0, #154880)" id="Vector" />
        </svg>
      </div>
      <div className="col-1 h-[27.281px] ml-[141.82px] mt-[0.6px] relative row-1 w-[17.847px]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.8466 27.2814">
          <path d={svgPaths.p1d838700} fill="var(--fill-0, #154880)" id="Vector" />
        </svg>
      </div>
      <div className="col-1 h-[26.756px] ml-[164.2px] mt-[0.6px] relative row-1 w-[2.362px]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2.36193 26.7559">
          <path d={svgPaths.p18172e80} fill="var(--fill-0, #154880)" id="Vector" />
        </svg>
      </div>
      <div className="col-1 h-[20.42px] ml-[170.12px] mt-[7.46px] relative row-1 w-[18.296px]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.2957 20.4199">
          <path d={svgPaths.p3fd801c0} fill="var(--fill-0, #154880)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="-translate-x-1/2 absolute content-stretch flex flex-col h-[53.095px] items-center left-[calc(50%-591px)] p-[10px] top-[13px] w-[208px]" data-name="logo">
      <Group8 />
    </div>
  );
}

function SideMenu() {
  return (
    <div className="absolute contents left-[-0.27px] top-0" data-name="Side Menu">
      <div className="absolute bg-white h-[960px] left-0 top-0 w-[259px]" data-name="background" />
      <div className="absolute h-0 left-[-0.27px] top-[80.5px] w-[259px]">
        <div className="absolute inset-[-0.5px_0]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 259 1">
            <path d="M0 0.5H259" id="Line 4" stroke="var(--stroke-0, #E2E2E2)" />
          </svg>
        </div>
      </div>
      <div className="absolute bg-[#fff1df] content-stretch flex gap-[10px] h-[40px] items-center left-[23px] p-[10px] rounded-[10px] top-[105px] w-[210px]" data-name="Dashboad">
        <CarbonDashboardReference />
        <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-[22.157px] justify-center leading-[0] not-italic relative shrink-0 text-[#484848] text-[15px] w-[81px]">
          <p className="leading-[20px] whitespace-pre-wrap">Dashboard</p>
        </div>
      </div>
      <div className="absolute content-stretch flex gap-[10px] h-[40px] items-center left-[23px] p-[10px] top-[165px] w-[210px]" data-name="My Course">
        <IconoirMediaVideoList />
        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold h-[22px] leading-[20px] not-italic relative shrink-0 text-[#484848] text-[15px] w-[149px] whitespace-pre-wrap">My Courses</p>
      </div>
      <Logo />
    </div>
  );
}

function Group4() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute contents left-[calc(50%+471.61px)] top-[calc(50%+0.5px)]">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[14px] justify-center leading-[0] left-[calc(50%+388.5px)] not-italic text-[#979797] text-[10px] top-[calc(50%+1px)] tracking-[0.1px] w-[60px]">
        <p className="leading-[normal] whitespace-pre-wrap">Powered By</p>
      </div>
      <div className="absolute h-[25px] left-[1043.7px] top-[11px] w-[101.515px]" data-name="NOVACTECH-LOGO-R 1">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgNovactechLogoR1} />
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="-translate-x-1/2 absolute bg-white bottom-0 h-[46px] left-[calc(50%+129.5px)] overflow-clip w-[1181px]" data-name="Footer">
      <Group4 />
    </div>
  );
}

export default function ChooseCreationMethod1440Desktop() {
  return (
    <div className="bg-[#f9f9f9] relative size-full" data-name="Choose Creation Method - 1440 - Desktop">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-[40px] justify-center leading-[0] left-[calc(50%-148px)] not-italic text-[#454545] text-[26px] top-[128px] w-[555px]">
        <p className="leading-[32px] whitespace-pre-wrap">Choose Your Course Creation Method</p>
      </div>
      <TopBar />
      <Group9 />
      <SideMenu />
      <Footer />
    </div>
  );
}