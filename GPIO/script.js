/* ---------------- 导航切换 ---------------- */
function switchTab(tabId) {
  document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));

  const targetPage = document.getElementById(tabId);
  if (targetPage) targetPage.classList.add("active");

  document.querySelectorAll(".nav-item").forEach((item) => {
    const onclickText = item.getAttribute("onclick") || "";
    if (onclickText.includes(`'${tabId}'`)) {
      item.classList.add("active");
    }
  });

  document.querySelectorAll("#main-gpio-svg .hl-active").forEach((el) => {
    el.classList.remove("hl-active");
  });

  if (tabId === "moder") hlSVG("svg-reg-moder");
  if (tabId === "otyper") hlSVG("svg-reg-otyper");
  if (tabId === "ospeedr") hlSVG("svg-reg-ospeedr");
  if (tabId === "pupdr") hlSVG("svg-reg-pupdr");
  if (tabId === "idr-odr") {
    hlSVG("svg-reg-idr");
    hlSVG("svg-reg-odr");
  }
  if (tabId === "bsrr") hlSVG("svg-reg-bsrr");
  if (tabId === "afr") hlSVG("svg-reg-afr");
}

function hlSVG(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hl-active");
}

/* ---------------- 位字段渲染 ---------------- */
function renderBitField(containerId, regName, bitsPerGroup) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let row1 = `<div class="bit-row group-${bitsPerGroup}">`;
  let row2 = `<div class="bit-row group-${bitsPerGroup}">`;

  for (let i = 31; i >= 16; i--) {
    row1 += `
      <div class="bit-cell" data-reg="${regName}" data-bit="${i}">
        <span class="bit-num">${i}</span>
        <span class="bit-val">x</span>
      </div>
    `;
  }
  row1 += `</div>`;

  for (let i = 15; i >= 0; i--) {
    row2 += `
      <div class="bit-cell" data-reg="${regName}" data-bit="${i}">
        <span class="bit-num">${i}</span>
        <span class="bit-val">x</span>
      </div>
    `;
  }
  row2 += `</div>`;

  container.innerHTML = row1 + row2;

  container.querySelectorAll(".bit-cell").forEach((cell) => {
    cell.addEventListener("click", function (e) {
      e.stopPropagation();
      const bitIndex = Number(this.dataset.bit);
      showBitInfo(regName, bitIndex, bitsPerGroup, container);
    });
  });
}

function resetInfoPanel(regName, defaultText) {
  const titleEl = document.getElementById(`${regName}-info-title`);
  const descEl = document.getElementById(`${regName}-info-desc`);
  if (titleEl) titleEl.innerText = "点击上方对应的位查看说明";
  if (descEl) descEl.innerText = defaultText;
}

function clearBitActive(container) {
  if (!container) return;
  container.querySelectorAll(".bit-cell").forEach((c) => c.classList.remove("active-bit"));
}

function bitToDomIndex(bitIndex) {
  return 31 - bitIndex;
}

function showBitInfo(regName, bitIndex, bitsPerGroup, container) {
  clearBitActive(container);

  const titleEl = document.getElementById(`${regName}-info-title`);
  const descEl = document.getElementById(`${regName}-info-desc`);

  if (!titleEl || !descEl) return;

  if (regName === "otyper" && bitIndex > 15) {
    titleEl.innerText = `Bit ${bitIndex}（保留位）`;
    descEl.innerText = "OTYPER 的高 16 位为保留位，不对应任何 GPIO 引脚。";
    return;
  }

  const cells = container.querySelectorAll(".bit-cell");

  if (bitsPerGroup === 2) {
    const pinNum = Math.floor(bitIndex / 2);
    const bitLow = pinNum * 2;
    const bitHigh = bitLow + 1;

    const cellLow = cells[bitToDomIndex(bitLow)];
    const cellHigh = cells[bitToDomIndex(bitHigh)];

    if (cellLow) cellLow.classList.add("active-bit");
    if (cellHigh) cellHigh.classList.add("active-bit");

    titleEl.innerText = `Pin ${pinNum} 的配置`;

    if (regName === "moder") {
      descEl.innerHTML = `
        控制引脚 Px${pinNum}：<br>
        00：输入模式<br>
        01：通用输出模式<br>
        10：复用功能模式<br>
        11：模拟模式
      `;
    } else if (regName === "ospeedr") {
      descEl.innerHTML = `
        控制引脚 Px${pinNum} 的翻转速度：<br>
        00：低速<br>
        01：中速<br>
        10：高速<br>
        11：极高速
      `;
    } else if (regName === "pupdr") {
      descEl.innerHTML = `
        控制引脚 Px${pinNum} 的内部上下拉：<br>
        00：无上下拉<br>
        01：上拉<br>
        10：下拉<br>
        11：保留
      `;
    }
  } else {
    const pinNum = bitIndex;
    const cell = cells[bitToDomIndex(bitIndex)];
    if (cell) cell.classList.add("active-bit");

    titleEl.innerText = `Pin ${pinNum} 的配置`;

    if (regName === "otyper") {
      descEl.innerHTML = `
        控制引脚 Px${pinNum} 的输出类型：<br>
        0：推挽输出（可主动输出高和低）<br>
        1：开漏输出（只能主动拉低，高电平依赖上拉）
      `;
    }
  }
}

/* ---------------- 初始化动画 ---------------- */
let currentStep = 0;

const steps = [
  {
    desc: "<b>准备就绪</b><br>在配置 GPIO 之前，必须先保证外设已经使能时钟。",
    active: []
  },
  {
    desc: "<b>步骤 1：开启时钟 (RCC)</b><br>先打开对应 GPIO 端口的时钟。",
    active: ["anim-rcc"]
  },
  {
    desc: "<b>步骤 2：配置模式 (MODER)</b><br>把目标引脚设置成输出模式。",
    active: ["anim-moder"]
  },
  {
    desc: "<b>步骤 3：配置输出类型 (OTYPER)</b><br>例如 LED 常用推挽输出。",
    active: ["anim-otyper"]
  },
  {
    desc: "<b>步骤 4：配置输出速度 (OSPEEDR)</b><br>低频场景通常选低速即可。",
    active: ["anim-ospeedr"]
  },
  {
    desc: "<b>步骤 5：配置上下拉 (PUPDR)</b><br>推挽输出一般选择无上下拉。",
    active: ["anim-pupdr"]
  },
  {
    desc: "<b>步骤 6：写入输出数据 (ODR/BSRR)</b><br>最终通过 BSRR 或 ODR 控制电平。",
    active: ["anim-odr"]
  }
];

function stepAnim(dir) {
  currentStep += dir;
  if (currentStep < 0) currentStep = 0;
  if (currentStep > steps.length - 1) currentStep = steps.length - 1;
  updateAnimUI();
}

function resetAnim() {
  currentStep = 0;
  updateAnimUI();
}

function updateAnimUI() {
  const stepText = document.getElementById("anim-step-text");
  const descText = document.getElementById("anim-desc-text");
  const prevBtn = document.getElementById("anim-prev");
  const nextBtn = document.getElementById("anim-next");

  if (stepText) stepText.innerText = `第 ${currentStep}/${steps.length - 1} 步`;
  if (descText) descText.innerHTML = steps[currentStep].desc;
  if (prevBtn) prevBtn.disabled = currentStep === 0;
  if (nextBtn) nextBtn.disabled = currentStep === steps.length - 1;

  document.querySelectorAll("#anim-svg .component-box").forEach((el) => {
    el.classList.remove("hl-active");
    el.style.fill = "";
    el.style.stroke = "";
    el.style.strokeWidth = "";
  });

  steps[currentStep].active.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hl-active");
  });
}

/* ---------------- 案例数据 ---------------- */
const casesData = {
  led: {
    title: "案例 1：PA5 驱动 LED（推挽输出）",
    desc: [
      "<b>硬件要求：</b>PA5 外接 LED，输出高电平点亮，低电平熄灭。",
      "<b>MODER：</b>01，通用输出模式。",
      "<b>OTYPER：</b>0，推挽输出。",
      "<b>OSPEEDR：</b>00，低速即可。",
      "<b>PUPDR：</b>00，无上下拉。",
      "<b>控制方式：</b><code>GPIOA->BSRR = (1 << 5);</code> 点亮，<code>GPIOA->BSRR = (1 << (5 + 16));</code> 熄灭。"
    ],
    regs: `MODER   = 01 (输出)
OTYPER  = 0  (推挽)
OSPEEDR = 00 (低速)
PUPDR   = 00 (无)
AFR     = XX (不关心)
引脚状态: 强驱动输出`
  },
  btn: {
    title: "案例 2：PC13 读取机械按键（上拉输入）",
    desc: [
      "<b>硬件要求：</b>PC13 接按键，按键另一端接地，无外部电阻。",
      "<b>MODER：</b>00，输入模式。",
      "<b>PUPDR：</b>01，内部上拉，保证按键松开时稳定为高电平。",
      "<b>读取方式：</b><code>if ((GPIOC->IDR & (1 << 13)) == 0)</code> 判断按下。"
    ],
    regs: `MODER   = 00 (输入)
OTYPER  = XX (无效)
OSPEEDR = XX (无效)
PUPDR   = 01 (上拉)
AFR     = XX (不关心)
引脚状态: 通过 IDR 读取`
  },
  i2c: {
    title: "案例 3：PB6 作为 I2C_SCL（开漏复用）",
    desc: [
      "<b>硬件要求：</b>总线上有外部上拉电阻，如 4.7kΩ。",
      "<b>MODER：</b>10，复用模式。",
      "<b>OTYPER：</b>1，开漏输出，这是 I2C 的关键要求。",
      "<b>OSPEEDR：</b>一般选高速或较高速度。",
      "<b>AFR：</b>查手册配置为 AF4（I2C1）。"
    ],
    regs: `MODER   = 10 (复用)
OTYPER  = 1  (开漏)
OSPEEDR = 10 (高速)
PUPDR   = 00 (外部已有上拉)
AFRL    = 0100 (AF4)
引脚状态: 交给 I2C 外设控制`
  },
  usart: {
    title: "案例 4：PA9 作为 USART1_TX（复用推挽）",
    desc: [
      "<b>硬件要求：</b>用于向外发送串口信号。",
      "<b>MODER：</b>10，复用模式。",
      "<b>OTYPER：</b>0，推挽输出。",
      "<b>PUPDR：</b>通常可选上拉，提高空闲高电平抗干扰能力。",
      "<b>AFR：</b>PA9 对应 USART1_TX 一般为 AF7。"
    ],
    regs: `MODER   = 10 (复用)
OTYPER  = 0  (推挽)
OSPEEDR = 10 (高速)
PUPDR   = 01 (上拉)
AFRH    = 0111 (AF7)
引脚状态: 交给 USART 外设控制`
  }
};

function showCase(caseId) {
  const detail = document.getElementById("case-detail");
  const title = document.getElementById("case-title");
  const desc = document.getElementById("case-desc");
  const regs = document.getElementById("case-regs");

  const data = casesData[caseId];
  if (!data) return;

  title.innerText = data.title;
  desc.innerHTML = data.desc.map((item) => `<li style="margin-bottom:10px;">${item}</li>`).join("");
  regs.innerText = data.regs;

  detail.classList.remove("hidden");

  setTimeout(() => {
    detail.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

/* ---------------- 初始化 ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  renderBitField("bitfield-moder", "moder", 2);
  renderBitField("bitfield-otyper", "otyper", 1);
  renderBitField("bitfield-ospeedr", "ospeedr", 2);
  renderBitField("bitfield-pupdr", "pupdr", 2);

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".bit-cell")) {
      resetInfoPanel("moder", "MODER 寄存器非常重要，配置错了引脚将完全不工作。默认复位状态通常为模拟模式(11)，以降低功耗。");
      resetInfoPanel("otyper", "主要决定输出电路是推挽还是开漏。高16位为保留位。");
      resetInfoPanel("ospeedr", "原则是：满足通信速率的前提下，速度越低越好，以减少 EMI。");
      resetInfoPanel("pupdr", "防止输入悬空。外部已经有上下拉时，内部通常配置为 00。");

      document.querySelectorAll(".bit-field-container").forEach((container) => {
        clearBitActive(container);
      });
    }
  });

  updateAnimUI();
});