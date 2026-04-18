function parseBR(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const normalized = String(value).replace(/\./g, "").replace(",", ".");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
}

function formatBR(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

function formatInputBRFromDigits(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  const number = Number(digits) / 100;
  return number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function handleMoneyInput(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return formatInputBRFromDigits(digits);
}

function handleDecimalInput(value) {
  let val = String(value || "").replace(/[^0-9,]/g, "");
  const parts = val.split(",");
  if (parts.length > 2) val = parts[0] + "," + parts[1];
  return val;
}

function icon(symbol) {
  return '<span class="icon-glyph" aria-hidden="true">' + symbol + "</span>";
}

const state = {
  custo: "0,00",
  quantidade: "1",
  frete: "0,00",
  stAtivo: true,
  notaTaxa: "10,00",
  sistemaTaxa: "6,00",
  margemLucro: "15,00",
  mostrarDetalhes: false,
};

function calcularResultado() {
  const custoNum = parseBR(state.custo);
  const freteNum = parseBR(state.frete);
  const margemNum = parseBR(state.margemLucro) / 100;
  const stPercentual = state.stAtivo ? 0.2 : 0;
  const nfPercentual = parseBR(state.notaTaxa) / 100;
  const sistemaPercentual = parseBR(state.sistemaTaxa) / 100;
  const qtdNum = Math.max(parseBR(state.quantidade) || 1, 0.0001);

  const custoProdutosTotal = custoNum * qtdNum;
  const freteUnitario = freteNum / qtdNum;
  const stTotal = custoProdutosTotal * stPercentual;
  const stUnitario = stTotal / qtdNum;
  const custoUnitario = custoNum + freteUnitario + stUnitario;
  const custoTotal = custoUnitario * qtdNum;
  const divisorVenda = 1 - nfPercentual - sistemaPercentual - margemNum;
  const precoVenda = divisorVenda > 0 ? custoUnitario / divisorVenda : 0;
  const valorNF = precoVenda * nfPercentual;
  const valorSistema = precoVenda * sistemaPercentual;
  const valorLucro = precoVenda * margemNum;
  const precoVendaTotal = precoVenda * qtdNum;

  return {
    custoProdutosTotal: custoProdutosTotal,
    custoTotal: custoTotal,
    custoUnitario: custoUnitario,
    freteUnitario: freteUnitario,
    stTotal: stTotal,
    stUnitario: stUnitario,
    valorNF: valorNF,
    valorSistema: valorSistema,
    valorLucro: valorLucro,
    precoVenda: precoVenda,
    precoVendaTotal: precoVendaTotal,
    markup: custoUnitario > 0 ? precoVenda / custoUnitario : 0,
  };
}

function getDetalhes(resultado) {
  return [
    ["Custo produtos total", formatBR(resultado.custoProdutosTotal)],
    ["Custo total", formatBR(resultado.custoTotal)],
    ["Frete por unidade", formatBR(resultado.freteUnitario)],
    ["Custo unitario", formatBR(resultado.custoUnitario)],
    ["ST total", formatBR(resultado.stTotal)],
    ["ST por unidade", formatBR(resultado.stUnitario)],
    ["Nota fiscal por unidade", formatBR(resultado.valorNF)],
    ["Sistema por unidade", formatBR(resultado.valorSistema)],
    ["Lucro liquido por unidade", formatBR(resultado.valorLucro)],
    ["Venda total", formatBR(resultado.precoVendaTotal)],
    ["Venda por unidade", formatBR(resultado.precoVenda)],
    ["Markup final", resultado.markup.toFixed(2) + "x"],
  ];
}

function renderApp() {
  const resultado = calcularResultado();
  const detalhes = getDetalhes(resultado);

  return `
    <div class="app-shell">
      <div class="app-frame">
        <section class="screen main-screen ${state.mostrarDetalhes ? "screen-hidden screen-left" : "screen-active"}">
          <div class="title-block">
            <h1>Calculadora de Preco</h1>
          </div>

          <div class="panel main-card">
            <div class="panel-header">
              <h2>Dados do produto</h2>
            </div>

            <div class="main-content">
              <div class="result-card">
                <div class="result-label">Preco final sugerido</div>
                <div class="result-value">${formatBR(resultado.precoVendaTotal)}</div>
              </div>

              <div class="field">
                <label class="field-label" for="custo">
                  <span class="field-icon">${icon("$")}</span>
                  Custo de produto (R$)
                </label>
                <input id="custo" class="input" type="tel" inputmode="decimal" placeholder="0,00" value="${state.custo}" data-field="custo" data-format="money" />
              </div>

              <div class="field">
                <label class="field-label" for="quantidade">
                  <span class="field-icon">${icon("#")}</span>
                  Quantidade de produto
                </label>
                <input id="quantidade" class="input" type="tel" inputmode="decimal" placeholder="0,00" value="${state.quantidade}" data-field="quantidade" data-format="decimal" />
              </div>

              <div class="field">
                <label class="field-label" for="frete">
                  <span class="field-icon">${icon("[]")}</span>
                  Frete total (R$)
                </label>
                <input id="frete" class="input" type="tel" inputmode="decimal" placeholder="0,00" value="${state.frete}" data-field="frete" data-format="money" />
              </div>

              <div class="tax-grid">
                <div class="field">
                  <label class="field-label compact">
                    <span class="field-icon">${icon("%")}</span>
                    Imposto ST
                  </label>
                  <div class="toggle-wrap">
                    <button type="button" class="btn ${state.stAtivo ? "toggle-active-yes" : "toggle-inactive"}" data-action="st-yes">Sim</button>
                    <button type="button" class="btn ${!state.stAtivo ? "toggle-active-no" : "toggle-inactive"}" data-action="st-no">Nao</button>
                  </div>
                </div>

                <div class="field">
                  <label class="field-label compact" for="notaTaxa">
                    <span class="field-icon">${icon("%")}</span>
                    Taxa de nota (%)
                  </label>
                  <input id="notaTaxa" class="input compact" type="tel" inputmode="decimal" placeholder="0,00" value="${state.notaTaxa}" data-field="notaTaxa" data-format="money" />
                </div>

                <div class="field">
                  <label class="field-label compact" for="sistemaTaxa">
                    <span class="field-icon">${icon("%")}</span>
                    Taxa de sistema (%)
                  </label>
                  <input id="sistemaTaxa" class="input compact" type="tel" inputmode="decimal" placeholder="0,00" value="${state.sistemaTaxa}" data-field="sistemaTaxa" data-format="money" />
                </div>

                <div class="field">
                  <label class="field-label compact" for="margemLucro">
                    <span class="field-icon">${icon("%")}</span>
                    Margem liquida (%)
                  </label>
                  <input id="margemLucro" class="input compact" type="tel" inputmode="decimal" placeholder="0,00" value="${state.margemLucro}" data-field="margemLucro" data-format="money" />
                </div>
              </div>

              <div class="footer-actions">
                <button type="button" class="btn outline" data-action="limpar">
                  ${icon("R")}
                  Limpar campos
                </button>
                <button type="button" class="btn primary" data-action="detalhes">
                  Ver detalhes
                  <span class="arrow-right" aria-hidden="true">&gt;</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="screen details-screen ${state.mostrarDetalhes ? "screen-active" : "screen-hidden screen-right"}">
          <div class="details-topbar">
            <button type="button" class="btn outline icon-only" data-action="voltar" aria-label="Voltar">
              <span aria-hidden="true">&lt;</span>
            </button>
            <div>
              <h2>Informacoes detalhadas</h2>
              <p>Resumo completo do calculo</p>
            </div>
          </div>

          <div class="panel details-card">
            <div class="details-grid">
              ${detalhes.map(function (item) {
                return `
                    <div class="detail-item">
                      <div class="detail-label">${item[0]}</div>
                      <div class="detail-value">${item[1]}</div>
                    </div>
                  `;
              }).join("")}
            </div>

            <div class="formula-card">
              Formula usada: custo do produto x quantidade. O frete total e rateado por unidade. O ST e aplicado sobre o custo total dos produtos quando ativado. A venda unitaria e calculada para sobrar a margem liquida definida, ja considerando taxa de nota e taxa de sistema sobre o valor final de venda.
            </div>
          </div>
        </section>
      </div>
    </div>
  `;
}

const root = document.querySelector("#root");

function atualizarTela(activeField) {
  root.innerHTML = renderApp();
  bindEvents();

  if (activeField) {
    const input = root.querySelector('[data-field="' + activeField + '"]');
    if (input) {
      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
    }
  }
}

function limparCampos() {
  state.custo = "0,00";
  state.quantidade = "1";
  state.frete = "0,00";
  state.stAtivo = true;
  state.notaTaxa = "10,00";
  state.sistemaTaxa = "6,00";
  state.margemLucro = "15,00";
}

function bindEvents() {
  root.querySelectorAll("[data-field]").forEach(function (input) {
    input.addEventListener("input", function (event) {
      const field = event.currentTarget.dataset.field;
      const format = event.currentTarget.dataset.format;
      const rawValue = event.currentTarget.value;

      state[field] = format === "decimal" ? handleDecimalInput(rawValue) : handleMoneyInput(rawValue);
      atualizarTela(field);
    });
  });

  const stYes = root.querySelector('[data-action="st-yes"]');
  const stNo = root.querySelector('[data-action="st-no"]');
  const limpar = root.querySelector('[data-action="limpar"]');
  const detalhes = root.querySelector('[data-action="detalhes"]');
  const voltar = root.querySelector('[data-action="voltar"]');

  if (stYes) {
    stYes.addEventListener("click", function () {
      state.stAtivo = true;
      atualizarTela();
    });
  }

  if (stNo) {
    stNo.addEventListener("click", function () {
      state.stAtivo = false;
      atualizarTela();
    });
  }

  if (limpar) {
    limpar.addEventListener("click", function () {
      limparCampos();
      atualizarTela();
    });
  }

  if (detalhes) {
    detalhes.addEventListener("click", function () {
      state.mostrarDetalhes = true;
      atualizarTela();
    });
  }

  if (voltar) {
    voltar.addEventListener("click", function () {
      state.mostrarDetalhes = false;
      atualizarTela();
    });
  }
}

atualizarTela();
