const modes = {
  floating: {
    title: "1. 浮空输入（Floating Input）",
    text: "解释：内部上拉和下拉电阻均断开，PMOS 和 NMOS 也处于关闭状态。引脚电平完全由外部信号决定。由于没有任何驱动，引脚处于高阻态，极易受电磁干扰产生随机抖动。\n典型应用：用于检测具有明确驱动能力的外部信号，或作为低功耗模式下的引脚状态。",
    pu: false,
    pd: false,
    pmos: false,
    nmos: false,
    buffer: true,
    analog: false,
    ext: "ext-floating",
    level: "hiz",
    flow: ""
  },
  pullup: {
    title: "2. 上拉输入（Pull-up Input）",
    text: "解释：内部上拉电阻开关接通，将引脚电平拉至 VDD。外部按键未按下时，引脚稳定在逻辑高电平；按键按下接 GND 时，引脚变为低电平。\n典型应用：读取低电平有效的按键开关信号，防止引脚悬空产生误触发。",
    pu: true,
    pd: false,
    pmos: false,
    nmos: false,
    buffer: true,
    analog: false,
    ext: "ext-button-gnd",
    level: "high",
    flow: "flow-pu"
  },
  pulldown: {
    title: "3. 下拉输入（Pull-down Input）",
    text: "解释：内部下拉电阻开关接通，将引脚电平拉至 GND。默认状态下引脚为逻辑低电平，只有当外部输入高电平时，引脚电平才会改变。\n典型应用：检测高电平有效的传感器信号，确保无信号输入时引脚电平为 0。",
    pu: false,
    pd: true,
    pmos: false,
    nmos: false,
    buffer: true,
    analog: false,
    ext: "ext-button-gnd",
    level: "low",
    flow: "flow-pd"
  },
  analog: {
    title: "4. 模拟输入（Analog Input）",
    text: "解释：关闭数字输入缓冲器，打开模拟通道开关，外部模拟电压直接传送到内部 ADC 模块。此模式下数字逻辑被隔离，以减少对模拟信号的干扰。\n典型应用：ADC 电压采集，如读取电位器、光敏电阻、温度传感器等。",
    pu: false,
    pd: false,
    pmos: false,
    nmos: false,
    buffer: false,
    analog: true,
    ext: "ext-analog",
    level: "hiz",
    flow: "flow-ana"
  },
  opendrain: {
    title: "5. 开漏输出（Open-Drain Output）",
    text: "解释：PMOS 始终关闭，只有 NMOS 工作。输出逻辑 0 时 NMOS 导通，引脚强拉至 GND；输出逻辑 1 时 NMOS 关闭，引脚处于高阻态，需要依靠外部上拉电阻将电平拉高。\n典型应用：I2C 总线、多机通信、电平转换。",
    pu: false,
    pd: false,
    pmos: false,
    nmos: true,
    buffer: true,
    analog: false,
    ext: "ext-i2c",
    level: "low",
    flow: "flow-od-low"
  },
  pushpull: {
    title: "6. 推挽输出（Push-Pull Output）",
    text: "解释：PMOS 和 NMOS 交替导通。输出 1 时 PMOS 导通，引脚为高电平；输出 0 时 NMOS 导通，引脚为低电平。推挽结构驱动能力强，信号切换快。\n典型应用：驱动 LED、高速数字信号传输、普通数字输出。",
    pu: false,
    pd: false,
    pmos: true,
    nmos: true,
    buffer: true,
    analog: false,
    ext: "ext-led",
    level: "high",
    flow: "flow-pp-high"
  },
  alt_opendrain: {
    title: "7. 复用开漏（Alternate Function Open-Drain）",
    text: "解释：输出控制权交给片上外设，如 I2C 控制器，而不是 GPIO 数据寄存器。物理结构仍然是开漏，因此适合总线通信。\n典型应用：硬件 I2C 接口的 SDA、SCL 引脚。",
    pu: false,
    pd: false,
    pmos: false,
    nmos: true,
    buffer: true,
    analog: false,
    ext: "ext-i2c",
    level: "low",
    flow: "flow-od-low",
    alt: true
  },
  alt_pushpull: {
    title: "8. 复用推挽（Alternate Function Push-Pull）",
    text: "解释：输出控制权交给片上外设，如 SPI、PWM、UART。推挽结构保证了信号上升沿和下降沿都较快，适合高速切换。\n典型应用：SPI 时钟线、PWM 输出、串口 TX。",
    pu: false,
    pd: false,
    pmos: true,
    nmos: true,
    buffer: true,
    analog: false,
    ext: "ext-led",
    level: "high",
    flow: "flow-pp-high",
    alt: true
  }
};

let currentModeKey = null;
let isAnimating = true;

function setMode(modeKey) {
  document.querySelectorAll(".mode-btn").forEach(btn => btn.classList.remove("active"));

  const buttons = Array.from(document.querySelectorAll(".mode-btn"));
  const activeBtn = buttons.find(btn =>
    btn.textContent.startsWith(modes[modeKey].title.split("（")[0])
  );
  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  const mode = modes[modeKey];
  currentModeKey = modeKey;

  document.getElementById("info-title").innerText = mode.title;
  document.getElementById("info-text").innerText = mode.text;

  updateCircuit(mode);
}

function updateCircuit(mode) {
  resetCircuit();

  if (mode.pu) {
    document.getElementById("pu-switch").classList.add("switch-closed");
    document.getElementById("pu-switch-wire").classList.add("wire-active");
  }

  if (mode.pd) {
    document.getElementById("pd-switch").classList.add("switch-closed");
    document.getElementById("pd-switch-wire").classList.add("wire-active");
  }

  if (mode.pmos) {
    document.getElementById("pmos-body").style.stroke = "var(--high-color)";
    document.getElementById("pmos-gate").classList.add("wire-high");
    document.getElementById("pmos-top").classList.add("wire-high");
  }

  if (mode.nmos) {
    document.getElementById("nmos-body").style.stroke = "var(--low-color)";
    document.getElementById("nmos-gate").classList.add("wire-low");
    document.getElementById("nmos-bottom").classList.add("wire-low");
  }

  if (mode.buffer) {
    document.getElementById("input-buffer").style.fill = "#e8f5e9";
    document.getElementById("input-buffer").style.stroke = "#2e7d32";
  } else {
    document.getElementById("input-buffer").style.fill = "#f5f5f5";
    document.getElementById("input-buffer").style.stroke = "#ccc";
  }

  if (mode.analog) {
    document.getElementById("analog-switch").classList.add("switch-closed");
    document.getElementById("analog-wire").classList.add("wire-active");
    document.getElementById("to-adc").classList.add("wire-active");
  }

  if (mode.alt) {
    document.getElementById("alt-func-path").style.stroke = "#1976d2";
    document.getElementById("alt-func-path").style.strokeDasharray = "none";
  } else {
    document.getElementById("alt-func-path").style.stroke = "#666";
    document.getElementById("alt-func-path").style.strokeDasharray = "5";
  }

  document.getElementById(mode.ext).setAttribute("visibility", "visible");

  if (mode.ext === "ext-led" && mode.level === "high") {
    document.getElementById("led-circle").style.fill = "#fff176";
    document.getElementById("led-circle").style.stroke = "#fbc02d";
  } else if (mode.ext === "ext-led") {
    document.getElementById("led-circle").style.fill = "none";
    document.getElementById("led-circle").style.stroke = "#333";
  }

  const dot = document.getElementById("status-dot");
  dot.setAttribute("class", "status-dot " + mode.level);

  ["main-wire", "pu-connect", "pd-connect", "mos-connect"].forEach(id => {
    const el = document.getElementById(id);
    el.setAttribute("class", "wire wire-" + mode.level);
  });

  if (mode.flow && isAnimating) {
    document.getElementById(mode.flow).classList.add("flowing");
  }
}

function resetCircuit() {
  document.getElementById("pu-switch").classList.remove("switch-closed");
  document.getElementById("pd-switch").classList.remove("switch-closed");
  document.getElementById("analog-switch").classList.remove("switch-closed");

  document.querySelectorAll(".wire").forEach(w => {
    w.setAttribute("class", "wire");
  });

  document.getElementById("pmos-body").style.stroke = "#333";
  document.getElementById("nmos-body").style.stroke = "#333";
  document.getElementById("pmos-gate").setAttribute("class", "wire");
  document.getElementById("nmos-gate").setAttribute("class", "wire");
  document.getElementById("pmos-top").setAttribute("class", "wire");
  document.getElementById("nmos-bottom").setAttribute("class", "wire");

  ["ext-floating", "ext-button-gnd", "ext-led", "ext-i2c", "ext-analog"].forEach(id => {
    document.getElementById(id).setAttribute("visibility", "hidden");
  });

  document.querySelectorAll(".arrow").forEach(a => a.classList.remove("flowing"));
}

function toggleAnimation() {
  isAnimating = !isAnimating;
  if (currentModeKey) {
    setMode(currentModeKey);
  }
}

function resetAnimation() {
  if (currentModeKey) {
    setMode(currentModeKey);
  }
}

window.onload = () => {
  setMode("floating");
};