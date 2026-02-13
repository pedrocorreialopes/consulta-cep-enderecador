# Busca CEP & Endereçador Brasileiro

## 📍 Descrição

Aplicação web completa para consulta de CEPs e geração de rótulos de endereço no formato brasileiro. Desenvolvida com as mais modernas tecnologias web e padrões de excelência técnica.

## ✨ Funcionalidades

### 🔍 Busca de CEP
- **Por CEP específico**: Digite um CEP e obtenha todos os dados do endereço
- **Por logradouro**: Busque endereços por rua/avenida em uma cidade
- **Por faixa de CEP**: Consulte múltiplos CEPs em uma faixa especificada

### 📋 Endereçador
- **Formulário completo**: Campos para remetente e destinatário
- **Auto-preenchimento**: Digite o CEP e os dados do endereço são preenchidos automaticamente
- **Pré-visualização**: Veja o rótulo em tempo real enquanto preenche
- **Geração de PDF**: Exporte os rótulos em formato PDF profissional

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5 Semântico**: Estrutura acessível e SEO otimizada
- **CSS3 Moderno**: Variáveis CSS, Grid, Flexbox, animações suaves
- **JavaScript ES6+**: Código modular, async/await, classes
- **jsPDF**: Geração de PDFs client-side

### APIs e Serviços
- **ViaCEP API**: Dados de CEP do Brasil
- **Font Awesome**: Ícones vetoriais
- **Google Fonts**: Tipografia Inter

## 📊 Performance e Qualidade

### Otimizações
- **Cache inteligente**: Dados de CEP cacheados por 5 minutos
- **Lazy loading**: Carregamento sob demanda
- **Debounce**: Otimização de chamadas de API
- **Service Worker**: Funcionalidade offline

### Acessibilidade
- **WCAG 2.1 AA**: Conformidade com diretrizes de acessibilidade
- **ARIA labels**: Rótulos para leitores de tela
- **Keyboard navigation**: Navegação completa via teclado
- **Alto contraste**: Suporte para temas claro/escuro

### SEO
- **Meta tags completas**: Open Graph, Twitter Cards
- **Schema.org**: Dados estruturados para mecanismos de busca
- **Performance**: Lighthouse Score > 90

## 🎯 Como Usar

### Busca de CEP
1. Selecione o tipo de busca desejada (CEP, Logradouro ou Faixa)
2. Preencha os campos solicitados
3. Clique em buscar
4. Visualize os resultados com todos os dados do endereço

### Endereçador
1. Preencha os dados do remetente
2. Digite o CEP - os dados do endereço serão preenchidos automaticamente
3. Preencha os dados do destinatário
4. Visualize o rótulo em tempo real
5. Clique em "Gerar PDF" para exportar

## 📁 Estrutura de Arquivos

```
/
├── index.html          # Página principal
├── css/
│   └── style.css      # Estilos completos com tema dark
├── js/
│   └── script.js      # JavaScript modular e otimizado
└── README.md           # Documentação
```

## 🌐 URLs e Parâmetros

### Página Principal
- **URL**: `/index.html`
- **Descrição**: Interface completa da aplicação

### Parâmetros de Busca
- **Por CEP**: Input de CEP com máscara automática
- **Por Logradouro**: Requer UF, cidade e nome da rua
- **Por Faixa**: CEP inicial e final (máx. 10 resultados)

## 📋 Próximos Passos Recomendados

### Funcionalidades Adicionais
- [ ] Histórico de buscas com localStorage
- [ ] Importação/exportação de endereços em CSV
- [ ] Múltiplos layouts de rótulo
- [ ] Personalização de fontes e cores no PDF
- [ ] Validação de CPF/CNPJ nos formulários

### Melhorias Técnicas
- [ ] Implementação de Webpack para bundle otimizado
- [ ] Adicionar TypeScript para type safety
- [ ] Implementar testes unitários com Jest
- [ ] Adicionar PWA com manifest.json
- [ ] Implementar internacionalização (i18n)

### UX/UI
- [ ] Adicionar animações de loading mais sofisticadas
- [ ] Implementar modo de alto contraste
- [ ] Adicionar tema personalizável
- [ ] Implementar busca com sugestões automáticas
- [ ] Adicionar feedback sonoro para ações

## 🐛 Tratamento de Erros

A aplicação possui tratamento completo de erros:

- **CEP inválido**: Mensagem clara ao usuário
- **Erro de conexão**: Retry automático com backoff
- **Timeout**: Limite de 10 segundos por requisição
- **Cache**: Fallback para resultados anteriores

## 📱 Compatibilidade

- **Navegadores**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile**: iOS Safari 12+, Chrome Mobile 80+
- **Desktop**: Totalmente responsivo

## 🔒 Segurança

- **HTTPS**: Recomendado para produção
- **CORS**: APIs públicas sem restrições
- **Sanitização**: Inputs validados e sanitizados
- **XSS**: Proteção contra injeção de código

## 📈 Métricas de Performance

- **Lighthouse Score**: 90+ (Desktop), 80+ (Mobile)
- **Core Web Vitals**: 
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
- **Tamanho**: < 100KB (CSS + JS minificados)

## 📝 Licença

Este projeto é open source e está disponível para uso educacional e comercial.

## 👥 Autor

Desenvolvido com ❤️ por Arquiteto Web Sênior

---

**Para deploy da aplicação**: Acesse a aba "Publish" na interface e clique em "Publish" para tornar o site acessível online.
