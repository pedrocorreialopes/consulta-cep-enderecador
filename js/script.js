/**
 * BUSCA CEP & ENDEREÇADOR BRASILEIRO
 * JavaScript Principal - Arquitetura Modular e Performance Otimizada
 * 
 * @author Arquiteto Web Sênior
 * @version 1.0.0
 * @description Sistema completo para busca de CEP e geração de rótulos de endereço
 */

'use strict';

// ==========================================
// CONFIGURAÇÕES GLOBAIS E CONSTANTES
// ==========================================

const CONFIG = {
  API_BASE_URL: 'https://viacep.com.br/ws',
  API_FORMAT: 'json',
  TIMEOUT: 10000,
  RETRIES: 3,
  CACHE_DURATION: 300000, // 5 minutos
  
  // Validações e máscaras
  CEP_REGEX: /^\d{5}-?\d{3}$/,
  CEP_MASK: '#####-###',
  
  // Configurações de PDF
  PDF: {
    ORIENTATION: 'portrait',
    UNIT: 'mm',
    FORMAT: 'a4',
    MARGINS: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    }
  }
};

// ==========================================
// ESTADO GLOBAL DA APLICAÇÃO
// ==========================================

const AppState = {
  cache: new Map(),
  currentTab: 'cep',
  isLoading: false,
  formData: {
    remetente: {},
    destinatario: {}
  }
};

// ==========================================
// CLASSE DE UTILIDADES
// ==========================================

class Utils {
  /**
   * Aplica máscara de CEP no input
   */
  static aplicarMascaraCEP(value) {
    if (!value) return '';
    
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara
    if (numbers.length <= 5) {
      return numbers;
    }
    
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  }
  
  /**
   * Valida formato de CEP
   */
  static validarCEP(cep) {
    if (!cep) return false;
    const cleanCEP = cep.replace(/\D/g, '');
    return cleanCEP.length === 8;
  }
  
  /**
   * Formata CEP para exibição
   */
  static formatarCEP(cep) {
    if (!cep) return '';
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return cep;
    return `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5)}`;
  }
  
  /**
   * Capitaliza texto (primeira letra de cada palavra)
   */
  static capitalizar(texto) {
    if (!texto) return '';
    return texto.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
  }
  
  /**
   * Remove acentos e caracteres especiais
   */
  static normalizarTexto(texto) {
    if (!texto) return '';
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '');
  }
  
  /**
   * Debounce para otimizar chamadas
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Mostra/oculta loading
   */
  static toggleLoading(show = true) {
    AppState.isLoading = show;
    document.body.classList.toggle('loading', show);
  }
  
  /**
   * Exibe notificação toast
   */
  static showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animação de entrada
    requestAnimationFrame(() => {
      toast.classList.add('toast--show');
    });
    
    // Remove após o tempo especificado
    setTimeout(() => {
      toast.classList.remove('toast--show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, duration);
  }
}

// ==========================================
// CLASSE DE CACHE
// ==========================================

class CacheManager {
  constructor() {
    this.cache = new Map();
  }
  
  /**
   * Adiciona item ao cache com TTL
   */
  set(key, value, ttl = CONFIG.CACHE_DURATION) {
    const expires = Date.now() + ttl;
    this.cache.set(key, { value, expires });
  }
  
  /**
   * Recupera item do cache
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  /**
   * Remove item do cache
   */
  delete(key) {
    this.cache.delete(key);
  }
  
  /**
   * Limpa cache expirado
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// ==========================================
// CLASSE DE API
// ==========================================

class CEPAPI {
  constructor() {
    this.cache = new CacheManager();
    this.baseURL = CONFIG.API_BASE_URL;
    this.format = CONFIG.API_FORMAT;
  }
  
  /**
   * Busca CEP específico
   */
  async buscarCEP(cep) {
    if (!Utils.validarCEP(cep)) {
      throw new Error('CEP inválido');
    }
    
    const cleanCEP = cep.replace(/\D/g, '');
    const cacheKey = `cep:${cleanCEP}`;
    
    // Verifica cache primeiro
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await fetch(
        `${this.baseURL}/${cleanCEP}/${this.format}/`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Verifica se o CEP existe
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }
      
      // Formata os dados
      const resultado = {
        cep: Utils.formatarCEP(data.cep),
        logradouro: Utils.capitalizar(data.logradouro || ''),
        complemento: Utils.capitalizar(data.complemento || ''),
        bairro: Utils.capitalizar(data.bairro || ''),
        localidade: Utils.capitalizar(data.localidade || ''),
        uf: data.uf || '',
        ibge: data.ibge || '',
        gia: data.gia || '',
        ddd: data.ddd || '',
        siafi: data.siafi || ''
      };
      
      // Armazena no cache
      this.cache.set(cacheKey, resultado);
      
      return resultado;
      
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Erro de conexão com o servidor');
      }
      throw error;
    }
  }
  
  /**
   * Busca por logradouro
   */
  async buscarPorLogradouro(uf, cidade, logradouro) {
    if (!uf || !cidade || !logradouro) {
      throw new Error('UF, cidade e logradouro são obrigatórios');
    }
    
    const cacheKey = `logradouro:${uf}:${cidade}:${logradouro}`;
    
    // Verifica cache primeiro
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await fetch(
        `${this.baseURL}/${uf}/${cidade}/${logradouro}/${this.format}/`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Formata os resultados
      const resultados = Array.isArray(data) ? data : [data];
      
      const formatados = resultados.map(item => ({
        cep: Utils.formatarCEP(item.cep),
        logradouro: Utils.capitalizar(item.logradouro || ''),
        complemento: Utils.capitalizar(item.complemento || ''),
        bairro: Utils.capitalizar(item.bairro || ''),
        localidade: Utils.capitalizar(item.localidade || ''),
        uf: item.uf || '',
        ibge: item.ibge || '',
        gia: item.gia || '',
        ddd: item.ddd || '',
        siafi: item.siafi || ''
      }));
      
      // Armazena no cache
      this.cache.set(cacheKey, formatados);
      
      return formatados;
      
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Erro de conexão com o servidor');
      }
      throw error;
    }
  }
}

// ==========================================
// CLASSE DE INTERFACE DO USUÁRIO
// ==========================================

class UIManager {
  constructor() {
    this.elements = this.cacheElements();
    this.bindEvents();
  }
  
  /**
   * Cache de elementos DOM para performance
   */
  cacheElements() {
    return {
      // Tabs
      tabs: document.querySelectorAll('.busca__tab'),
      tabContents: {
        cep: document.getElementById('campoCEP'),
        logradouro: document.getElementById('campoLogradouro'),
        faixa: document.getElementById('campoFaixa')
      },
      
      // Formulários
      formBuscaCEP: document.getElementById('formBuscaCEP'),
      formEnderecador: document.getElementById('formEnderecador'),
      
      // Inputs
      cepInput: document.getElementById('cep'),
      logradouroInput: document.getElementById('logradouro'),
      cepInicialInput: document.getElementById('cepInicial'),
      cepFinalInput: document.getElementById('cepFinal'),
      
      // Botões
      btnBuscarCEP: document.getElementById('btnBuscarCEP'),
      btnBuscarLogradouro: document.getElementById('btnBuscarLogradouro'),
      btnBuscarFaixa: document.getElementById('btnBuscarFaixa'),
      btnLimparResultados: document.getElementById('btnLimparResultados'),
      btnLimparFormulario: document.getElementById('btnLimparFormulario'),
      btnGerarPDF: document.getElementById('btnGerarPDF'),
      
      // Resultados
      resultadoBusca: document.getElementById('resultadoBusca'),
      resultadoContent: document.getElementById('resultadoContent'),
      
      // Previews
      remetentePreview: document.getElementById('remetentePreview'),
      destinatarioPreview: document.getElementById('destinatarioPreview'),
      
      // Forms de endereçador
      remetenteCEP: document.getElementById('remetenteCEP'),
      destinatarioCEP: document.getElementById('destinatarioCEP')
    };
  }
  
  /**
   * Bind de eventos
   */
  bindEvents() {
    // Tabs
    this.elements.tabs.forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });
    
    // Máscara de CEP
    [this.elements.cepInput, this.elements.cepInicialInput, this.elements.cepFinalInput, 
     this.elements.remetenteCEP, this.elements.destinatarioCEP].forEach(input => {
      if (input) {
        input.addEventListener('input', (e) => {
          e.target.value = Utils.aplicarMascaraCEP(e.target.value);
        });
      }
    });
    
    // Auto-complete de CEP
    this.elements.remetenteCEP?.addEventListener('blur', (e) => {
      this.autoCompleteEndereco(e.target.value, 'remetente');
    });
    
    this.elements.destinatarioCEP?.addEventListener('blur', (e) => {
      this.autoCompleteEndereco(e.target.value, 'destinatario');
    });
    
    // Botões de busca
    this.elements.btnBuscarCEP?.addEventListener('click', () => this.buscarCEP());
    this.elements.btnBuscarLogradouro?.addEventListener('click', () => this.buscarLogradouro());
    this.elements.btnBuscarFaixa?.addEventListener('click', () => this.buscarFaixaCEP());
    
    // Botões de limpeza
    this.elements.btnLimparResultados?.addEventListener('click', () => this.limparResultados());
    this.elements.btnLimparFormulario?.addEventListener('click', () => this.limparFormulario());
    
    // Formulário de endereçador
    this.elements.formEnderecador?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.gerarPDF();
    });
    
    // Atualização em tempo real do preview
    this.setupLivePreview();
  }
  
  /**
   * Alterna entre tabs
   */
  switchTab(tabName) {
    AppState.currentTab = tabName;
    
    // Atualiza tabs ativas
    this.elements.tabs.forEach(tab => {
      const isActive = tab.dataset.tab === tabName;
      tab.classList.toggle('busca__tab--active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });
    
    // Mostra/esconde conteúdo
    Object.entries(this.elements.tabContents).forEach(([key, element]) => {
      if (element) {
        element.classList.toggle('form__group--hidden', key !== tabName);
      }
    });
  }
  
  /**
   * Busca CEP específico
   */
  async buscarCEP() {
    const cep = this.elements.cepInput.value;
    
    if (!Utils.validarCEP(cep)) {
      Utils.showToast('Por favor, digite um CEP válido', 'error');
      return;
    }
    
    try {
      Utils.toggleLoading(true);
      
      const api = new CEPAPI();
      const resultado = await api.buscarCEP(cep);
      
      this.exibirResultados([resultado]);
      
    } catch (error) {
      Utils.showToast(error.message || 'Erro ao buscar CEP', 'error');
    } finally {
      Utils.toggleLoading(false);
    }
  }
  
  /**
   * Busca por logradouro
   */
  async buscarLogradouro() {
    const logradouro = this.elements.logradouroInput.value;
    
    if (!logradouro.trim()) {
      Utils.showToast('Por favor, digite um logradouro', 'error');
      return;
    }
    
    // Para simplificar, vamos pedir UF e cidade via prompt
    const uf = prompt('Digite a UF (ex: SP, RJ, MG):');
    if (!uf || uf.length !== 2) {
      Utils.showToast('UF inválida', 'error');
      return;
    }
    
    const cidade = prompt('Digite o nome da cidade:');
    if (!cidade || !cidade.trim()) {
      Utils.showToast('Cidade é obrigatória', 'error');
      return;
    }
    
    try {
      Utils.toggleLoading(true);
      
      const api = new CEPAPI();
      const resultados = await api.buscarPorLogradouro(uf.toUpperCase(), cidade, logradouro);
      
      this.exibirResultados(resultados);
      
    } catch (error) {
      Utils.showToast(error.message || 'Erro ao buscar logradouro', 'error');
    } finally {
      Utils.toggleLoading(false);
    }
  }
  
  /**
   * Busca por faixa de CEP (simulado)
   */
  async buscarFaixaCEP() {
    const cepInicial = this.elements.cepInicialInput.value;
    const cepFinal = this.elements.cepFinalInput.value;
    
    if (!Utils.validarCEP(cepInicial) || !Utils.validarCEP(cepFinal)) {
      Utils.showToast('Por favor, digite CEPs válidos', 'error');
      return;
    }
    
    // Como a API ViaCEP não tem endpoint para faixa, vamos buscar os CEPs individualmente
    try {
      Utils.toggleLoading(true);
      
      const api = new CEPAPI();
      const numInicial = parseInt(cepInicial.replace(/\D/g, ''));
      const numFinal = parseInt(cepFinal.replace(/\D/g, ''));
      
      if (numInicial > numFinal) {
        Utils.showToast('CEP inicial deve ser menor que o final', 'error');
        return;
      }
      
      // Limita a 10 CEPs para não sobrecarregar
      const promises = [];
      const maxCEPs = Math.min(10, numFinal - numInicial + 1);
      
      for (let i = 0; i < maxCEPs; i++) {
        const cep = String(numInicial + i).padStart(8, '0');
        promises.push(api.buscarCEP(cep).catch(() => null));
      }
      
      const resultados = await Promise.all(promises);
      const validos = resultados.filter(r => r !== null);
      
      if (validos.length === 0) {
        Utils.showToast('Nenhum CEP encontrado na faixa especificada', 'warning');
        return;
      }
      
      this.exibirResultados(validos);
      
    } catch (error) {
      Utils.showToast(error.message || 'Erro ao buscar faixa de CEP', 'error');
    } finally {
      Utils.toggleLoading(false);
    }
  }
  
  /**
   * Exibe resultados da busca
   */
  exibirResultados(resultados) {
    if (!resultados || resultados.length === 0) {
      this.elements.resultadoContent.innerHTML = `
        <div class="resultado__empty">
          <i class="fas fa-search" aria-hidden="true"></i>
          <p>Nenhum resultado encontrado</p>
        </div>
      `;
      return;
    }
    
    const html = resultados.map(item => `
      <div class="resultado__item fade-in">
        <div class="resultado__item-header">
          <h5 class="resultado__item-title">${item.logradouro || 'Endereço não encontrado'}</h5>
          <span class="resultado__item-cep">${item.cep}</span>
        </div>
        <div class="resultado__item-dados">
          ${item.bairro ? `<div class="resultado__item-dado"><strong>Bairro:</strong> ${item.bairro}</div>` : ''}
          ${item.localidade ? `<div class="resultado__item-dado"><strong>Cidade:</strong> ${item.localidade} - ${item.uf}</div>` : ''}
          ${item.complemento ? `<div class="resultado__item-dado"><strong>Complemento:</strong> ${item.complemento}</div>` : ''}
          ${item.ddd ? `<div class="resultado__item-dado"><strong>DDD:</strong> ${item.ddd}</div>` : ''}
        </div>
      </div>
    `).join('');
    
    this.elements.resultadoContent.innerHTML = html;
  }
  
  /**
   * Limpa resultados
   */
  limparResultados() {
    this.elements.resultadoContent.innerHTML = `
      <div class="resultado__empty">
        <i class="fas fa-map-marked-alt" aria-hidden="true"></i>
        <p>Os resultados aparecerão aqui</p>
      </div>
    `;
    this.elements.cepInput.value = '';
    this.elements.logradouroInput.value = '';
  }
  
  /**
   * Auto-completa endereço pelo CEP
   */
  async autoCompleteEndereco(cep, tipo) {
    if (!Utils.validarCEP(cep)) return;
    
    try {
      const api = new CEPAPI();
      const endereco = await api.buscarCEP(cep);
      
      // Preenche os campos
      const campos = {
        endereco: `${endereco.logradouro} ${endereco.complemento}`.trim(),
        bairro: endereco.bairro,
        cidade: endereco.localidade,
        uf: endereco.uf
      };
      
      Object.entries(campos).forEach(([campo, valor]) => {
        const input = document.getElementById(`${tipo}${Utils.capitalizar(campo)}`);
        if (input && !input.value) {
          input.value = valor;
        }
      });
      
      // Atualiza preview
      this.atualizarPreview();
      
    } catch (error) {
      console.warn('Erro ao auto-completar CEP:', error.message);
    }
  }
  
  /**
   * Configura preview em tempo real
   */
  setupLivePreview() {
    const campos = [
      'remetenteNome', 'remetenteEndereco', 'remetenteNumero', 'remetenteBairro', 
      'remetenteComplemento', 'remetenteCidade', 'remetenteUF',
      'destinatarioNome', 'destinatarioEndereco', 'destinatarioNumero', 
      'destinatarioBairro', 'destinatarioComplemento', 'destinatarioCidade', 'destinatarioUF'
    ];
    
    campos.forEach(campoId => {
      const campo = document.getElementById(campoId);
      if (campo) {
        campo.addEventListener('input', Utils.debounce(() => {
          this.atualizarPreview();
        }, 300));
      }
    });
  }
  
  /**
   * Atualiza preview do rótulo
   */
  atualizarPreview() {
    const dadosRemetente = this.coletarDadosFormulario('remetente');
    const dadosDestinatario = this.coletarDadosFormulario('destinatario');
    
    // Atualiza remetente
    if (dadosRemetente.nome) {
      this.elements.remetentePreview.innerHTML = `
        <p><strong>${dadosRemetente.nome}</strong></p>
        <p>${dadosRemetente.endereco}, ${dadosRemetente.numero}</p>
        ${dadosRemetente.complemento ? `<p>${dadosRemetente.complemento}</p>` : ''}
        <p>${dadosRemetente.bairro}</p>
        <p>${dadosRemetente.cidade} - ${dadosRemetente.uf}</p>
        <p>CEP: ${dadosRemetente.cep}</p>
      `;
    }
    
    // Atualiza destinatário
    if (dadosDestinatario.nome) {
      this.elements.destinatarioPreview.innerHTML = `
        <p><strong>${dadosDestinatario.nome}</strong></p>
        <p>${dadosDestinatario.endereco}, ${dadosDestinatario.numero}</p>
        ${dadosDestinatario.complemento ? `<p>${dadosDestinatario.complemento}</p>` : ''}
        <p>${dadosDestinatario.bairro}</p>
        <p>${dadosDestinatario.cidade} - ${dadosDestinatario.uf}</p>
        <p>CEP: ${dadosDestinatario.cep}</p>
      `;
    }
  }
  
  /**
   * Coleta dados do formulário
   */
  /**
   * Coleta dados do formulário
   */
  coletarDadosFormulario(tipo) {
    const dados = {};
    const campos = ['nome', 'cep', 'endereco', 'numero', 'bairro', 'complemento', 'cidade', 'uf'];
    
    campos.forEach(campo => {
      // Cria o sufixo com a primeira letra maiúscula
      let sufixo = campo.charAt(0).toUpperCase() + campo.slice(1);
      
      // Trata as exceções para que o JS busque os IDs exatos do HTML
      if (campo === 'cep') sufixo = 'CEP';
      if (campo === 'uf') sufixo = 'UF';
      
      const input = document.getElementById(`${tipo}${sufixo}`);
      dados[campo] = input ? input.value.trim() : '';
    });
    
    return dados;
  }
  
  /**
   * Limpa formulário
   */
  limparFormulario() {
    if (confirm('Tem certeza que deseja limpar todos os campos?')) {
      this.elements.formEnderecador.reset();
      this.atualizarPreview();
    }
  }
  
  /**
   * Gera PDF com o rótulo
   */
  async gerarPDF() {
    const dadosRemetente = this.coletarDadosFormulario('remetente');
    const dadosDestinatario = this.coletarDadosFormulario('destinatario');
    
    // Validação básica
    if (!dadosRemetente.nome || !dadosDestinatario.nome) {
      Utils.showToast('Por favor, preencha pelo menos os nomes de remetente e destinatário', 'error');
      return;
    }
    
    try {
      Utils.toggleLoading(true);
      
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: CONFIG.PDF.ORIENTATION,
        unit: CONFIG.PDF.UNIT,
        format: CONFIG.PDF.FORMAT
      });
      
      // Configurações de layout
      const margins = CONFIG.PDF.MARGINS;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margins.left - margins.right;
      
      // Fonte e cores
      doc.setFont('helvetica');
      const primaryColor = '#2563eb';
      const textColor = '#1f2937';
      const borderColor = '#e5e7eb';
      
      // Função para desenhar caixa de endereço
      const drawAddressBox = (x, y, width, height, title, dados) => {
        // Borda
        doc.setDrawColor(borderColor);
        doc.setLineWidth(0.5);
        doc.rect(x, y, width, height);
        
        // Título
        doc.setFillColor(primaryColor);
        doc.rect(x, y, width, 15, 'F');
        
        doc.setTextColor('#ffffff');
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(title, x + 5, y + 10);
        
        // Conteúdo
        doc.setTextColor(textColor);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        let textY = y + 25;
        const lineHeight = 5;
        
        // Nome
        if (dados.nome) {
          doc.setFont(undefined, 'bold');
          doc.text(dados.nome, x + 5, textY);
          doc.setFont(undefined, 'normal');
          textY += lineHeight;
        }
        
        // Endereço
        const endereco = `${dados.endereco}${dados.numero ? ', ' + dados.numero : ''}`;
        if (endereco.trim() !== ',') {
          doc.text(endereco, x + 5, textY);
          textY += lineHeight;
        }
        
        // Complemento
        if (dados.complemento) {
          doc.text(dados.complemento, x + 5, textY);
          textY += lineHeight;
        }
        
        // Bairro
        if (dados.bairro) {
          doc.text(dados.bairro, x + 5, textY);
          textY += lineHeight;
        }
        
        // Cidade/UF
        const cidadeUF = `${dados.cidade}${dados.uf ? ' - ' + dados.uf : ''}`;
        if (cidadeUF.trim() !== '' && cidadeUF.trim() !== '-') {
          doc.text(cidadeUF, x + 5, textY);
          textY += lineHeight;
        }
        
        // CEP
        if (dados.cep) {
          doc.text(`CEP: ${dados.cep}`, x + 5, textY);
        }
      };
      
      // Desenha caixas de endereço
      const boxWidth = contentWidth / 2 - 5;
      const boxHeight = 60;
      const yPosition = 50;
      
      // Remetente (esquerda)
      drawAddressBox(
        margins.left,
        yPosition,
        boxWidth,
        boxHeight,
        'REMETENTE',
        dadosRemetente
      );
      
      // Destinatário (direita)
      drawAddressBox(
        margins.left + boxWidth + 10,
        yPosition,
        boxWidth,
        boxHeight,
        'DESTINATÁRIO',
        dadosDestinatario
      );
      
      // Data e hora
      const now = new Date();
      doc.setTextColor(textColor);
      doc.setFontSize(8);
      doc.text(
        `Gerado em: ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`,
        margins.left,
        pageHeight - 10
      );
      
      // Salva o PDF
      const fileName = `rotulo-${Date.now()}.pdf`;
      doc.save(fileName);
      
      Utils.showToast('PDF gerado com sucesso!', 'success');
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      Utils.showToast('Erro ao gerar PDF', 'error');
    } finally {
      Utils.toggleLoading(false);
    }
  }
}

// ==========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================

class App {
  constructor() {
    this.uiManager = null;
    this.api = null;
  }
  
  /**
   * Inicializa a aplicação
   */
  init() {
    // Verifica se o DOM está pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }
  
  /**
   * Inicia os componentes
   */
  start() {
    try {
      // Inicializa gerenciadores
      this.uiManager = new UIManager();
      this.api = new CEPAPI();
      
      // Configurações finais
      this.setupErrorHandling();
      this.setupServiceWorker();
      
      console.log('✅ Aplicação inicializada com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao inicializar aplicação:', error);
      Utils.showToast('Erro ao inicializar aplicação', 'error');
    }
  }
  
  /**
   * Configura tratamento de erros global
   */
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('Erro global:', event.error);
      Utils.showToast('Ocorreu um erro inesperado', 'error');
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Promessa rejeitada não tratada:', event.reason);
      Utils.showToast('Ocorreu um erro inesperado', 'error');
    });
  }
  
  /**
   * Configura Service Worker para funcionalidade offline
   */
  async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        // Registra Service Worker simplificado para cache
        const sw = `
          self.addEventListener('install', (event) => {
            event.waitUntil(
              caches.open('cep-cache-v1').then((cache) => {
                return cache.addAll([
                  '/',
                  '/index.html',
                  '/css/style.css',
                  '/js/script.js'
                ]);
              })
            );
          });
          
          self.addEventListener('fetch', (event) => {
            event.respondWith(
              caches.match(event.request).then((response) => {
                return response || fetch(event.request);
              })
            );
          });
        `;
        
        const blob = new Blob([sw], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        
        const registration = await navigator.serviceWorker.register(swUrl);
        console.log('Service Worker registrado:', registration);
        
      } catch (error) {
        console.warn('Service Worker não pôde ser registrado:', error);
      }
    }
  }
}

// ==========================================
// INICIALIZA A APLICAÇÃO
// ==========================================

const app = new App();
app.init();

// ==========================================
// STYLES PARA TOAST E LOADING
// ==========================================

const styles = `
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 9999;
  transform: translateX(400px);
  transition: transform 0.3s ease;
  max-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast--show {
  transform: translateX(0);
}

.toast--info {
  background-color: #3b82f6;
}

.toast--success {
  background-color: #22c55e;
}

.toast--error {
  background-color: #ef4444;
}

.toast--warning {
  background-color: #f59e0b;
}

body.loading {
  cursor: wait;
}

body.loading * {
  pointer-events: none;
}
`;

// Adiciona styles ao DOM
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);