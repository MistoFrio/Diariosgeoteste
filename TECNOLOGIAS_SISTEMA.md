# 📚 Documentação Técnica - Stack de Tecnologias
## Sistema de Diários de Obra - Geoteste

---

## 🎯 Visão Geral

Sistema web full-stack para gerenciamento de diários de obra, desenvolvido como Progressive Web App (PWA) com suporte a múltiplos tipos de ensaios geotécnicos, geração de PDFs profissionais, e sincronização em tempo real.

---

## 🏗️ Arquitetura e Core

### **React 18.3.1**
**Função:** Biblioteca JavaScript para construção de interfaces de usuário baseada em componentes.

**Uso no Sistema:**
- Componentes funcionais com hooks (`useState`, `useEffect`, `useContext`)
- Gerenciamento de estado local e global
- Renderização condicional para diferentes tipos de diários (PCE, PIT, PLACA, PDA)
- Componentes reutilizáveis: `PdfLayout`, `PdfSection`, `PdfRow`, `PdfTable`
- Context API para autenticação (`AuthContext`) e notificações (`ToastContext`)

**Exemplo de Uso:**
```tsx
// Componente de visualização de diário PIT
export const PITDiaryView: React.FC<PITDiaryViewProps> = ({ diary, pitDetail, pitPiles }) => {
  return <PdfLayout diary={diary} title="DIÁRIO DE OBRA • PIT">...</PdfLayout>
}
```

---

### **TypeScript 5.5.3**
**Função:** Superset do JavaScript que adiciona tipagem estática opcional.

**Uso no Sistema:**
- Interfaces para tipagem de dados: `WorkDiary`, `Client`, `PCEFormData`, `PITFormData`
- Type safety em props de componentes
- Tipagem de funções utilitárias (PDF, Excel, CSV)
- Autocomplete e detecção de erros em tempo de desenvolvimento

**Exemplo:**
```typescript
interface PCEDiaryViewProps {
  diary: any;
  pceDetail: any;
  pcePiles: any[];
}
```

---

### **Vite 5.4.2**
**Função:** Build tool e dev server extremamente rápido, alternativa moderna ao Webpack.

**Uso no Sistema:**
- Servidor de desenvolvimento com Hot Module Replacement (HMR)
- Build otimizado para produção
- Code splitting automático
- Suporte nativo a TypeScript e ES modules

**Scripts:**
- `npm run dev` - Servidor de desenvolvimento (porta 5173)
- `npm run build` - Build de produção
- `npm run preview` - Preview da build

---

## 🎨 Estilização e UI

### **Tailwind CSS 3.4.1**
**Função:** Framework CSS utility-first para desenvolvimento rápido de interfaces.

**Uso no Sistema:**
- Classes utilitárias para layout (`flex`, `grid`, `items-center`)
- Responsividade (`sm:`, `md:`, `lg:`)
- Modo escuro (`dark:`)
- Espaçamento consistente (`px-0.5`, `py-1`, `gap-4`)
- Tamanhos de fonte pequenos para PDF (`text-[7px]`, `text-[6px]`)

**Exemplo:**
```tsx
<div className="flex items-center gap-1.5 bg-gray-200 border-b border-gray-400 px-0.5 py-1">
  <span className="text-[7px] font-bold uppercase">Identificação</span>
</div>
```

---

### **Lucide React 0.344.0**
**Função:** Biblioteca de ícones SVG otimizados para React.

**Uso no Sistema:**
- Ícones de navegação: `ArrowLeft`, `Search`, `Calendar`, `Clock`
- Ícones de ação: `Download`, `Edit`, `Trash2`, `Save`
- Ícones contextuais: `MapPin`, `User`, `Building2`, `FileText`
- Ícones de status: `Check`, `X`, `AlertCircle`

**Exemplo:**
```tsx
import { Download, Calendar, MapPin } from 'lucide-react';
<Download className="w-4 h-4" />
```

---

### **React Icons 5.5.0**
**Função:** Biblioteca adicional de ícones populares (Font Awesome, Material Design, etc.).

**Uso no Sistema:**
- Ícones complementares quando necessário
- Consistência visual com Lucide React

---

## 🗄️ Backend e Banco de Dados

### **Supabase (PostgreSQL)**
**Função:** Backend-as-a-Service (BaaS) que fornece banco de dados PostgreSQL, autenticação, storage e APIs REST/GraphQL.

**Uso no Sistema:**

#### **Autenticação (`@supabase/supabase-js` 2.57.4)**
- Login/logout de usuários
- Gerenciamento de sessões
- Proteção de rotas
- Perfis de usuário com assinaturas digitais

#### **Banco de Dados PostgreSQL**
- Tabelas principais:
  - `work_diaries` - Diários de obra principais
  - `work_diaries_pce` - Dados específicos de PCE
  - `work_diaries_pit` - Dados específicos de PIT
  - `work_diaries_placa` - Dados específicos de PLACA
  - `work_diaries_pda_diario` - Dados específicos de PDA
  - `work_diaries_pce_piles` - Estacas de PCE
  - `work_diaries_pit_piles` - Estacas de PIT
  - `work_diaries_placa_piles` - Pontos de PLACA
  - `clients` - Clientes
  - `profiles` - Perfis de usuários
  - `equipment_locations` - Localização de equipamentos

#### **Queries e Operações**
```typescript
// Exemplo: Buscar diários com joins
const { data } = await supabase
  .from('work_diaries')
  .select('*, profiles(name)')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

---

## 📄 Geração de PDFs

### **jsPDF 3.0.3**
**Função:** Biblioteca para geração de PDFs no lado do cliente.

**Uso no Sistema:**
- Criação de PDFs multi-página em formato A4
- Adição de imagens (logo, assinaturas)
- Cabeçalhos e rodapés com numeração de páginas
- Configuração de margens e espaçamento
- Compressão de imagens (PNG com compressão SLOW para máxima qualidade)

**Exemplo:**
```typescript
const pdf = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  compress: false
});
pdf.addImage(pageImgData, 'PNG', offsetX, offsetY, width, height, undefined, 'SLOW');
```

---

### **html2canvas 1.4.1**
**Função:** Biblioteca que captura screenshots de elementos HTML e converte em canvas.

**Uso no Sistema:**
- Captura de componentes React renderizados como imagens
- Renderização de alta qualidade (scale: 5.0 = ~227 DPI)
- Aplicação de estilos de alta qualidade no clone do DOM
- Forçar dimensões de celular (375px) durante captura para consistência
- Configurações de renderização: `crisp-edges`, `optimizeLegibility`, antialiasing

**Exemplo:**
```typescript
const canvas = await html2canvas(element, {
  scale: 5.0,
  useCORS: true,
  backgroundColor: '#ffffff',
  onclone: (clonedDoc) => {
    // Aplicar estilos de alta qualidade
  }
});
```

**Lógica de Quebra de Página:**
- Detecção de seções (`<section>`, `data-pdf-section`)
- Proteção contra quebra de seções no meio
- Prioridade especial para seção de assinaturas
- Cálculo de espaço disponível por página
- Movimento automático de seções para próxima página quando necessário

---

## 📊 Exportação de Dados

### **xlsx 0.18.5**
**Função:** Biblioteca para leitura e escrita de arquivos Excel (XLSX).

**Uso no Sistema:**
- Exportação de diários para formato Excel
- Criação de planilhas com múltiplas colunas
- Formatação de dados (datas, números)
- Download direto do navegador

**Exemplo:**
```typescript
import * as XLSX from 'xlsx';
const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Diários');
XLSX.writeFile(workbook, 'diarios.xlsx');
```

---

### **CSV (Utilitário Customizado)**
**Função:** Geração de arquivos CSV para exportação de dados.

**Uso no Sistema:**
- Exportação alternativa ao Excel
- Formato simples e compatível
- Conversão de dados de diários para CSV
- Download direto

---

## 🗺️ Mapas e Geolocalização

### **Leaflet 1.9.4 + React Leaflet 4.2.1**
**Função:** Biblioteca open-source para mapas interativos.

**Uso no Sistema:**
- Visualização de equipamentos em mapa
- Marcadores de localização
- Integração com OpenStreetMap
- Controle de zoom e pan
- Gestão de z-index para evitar sobreposição com outros elementos

**Exemplo:**
```tsx
import { MapContainer, TileLayer, Marker } from 'react-leaflet';

<MapContainer center={[lat, lng]} zoom={13}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  <Marker position={[lat, lng]} />
</MapContainer>
```

---

## ✍️ Assinatura Digital

### **react-signature-canvas 1.1.0-alpha.2**
**Função:** Componente React para captura de assinaturas digitais usando canvas.

**Uso no Sistema:**
- Captura de assinaturas de usuários e clientes
- Conversão para base64 para armazenamento
- Upload para Supabase Storage
- Exibição de assinaturas nos PDFs gerados
- Fallback para localStorage quando Supabase não está disponível

**Exemplo:**
```tsx
import SignatureCanvas from 'react-signature-canvas';

<SignatureCanvas
  ref={sigPad}
  canvasProps={{ className: 'signature-canvas' }}
  onEnd={handleEnd}
/>
```

---

## 📱 Mobile e PWA

### **Capacitor**
**Função:** Framework para construir aplicativos nativos usando tecnologias web.

**Uso no Sistema:**
- Geração de APK para Android
- Acesso a recursos nativos do dispositivo
- Build de aplicativo instalável

**Configuração:**
- `capacitor.config.ts` - Configuração do Capacitor
- Comandos: `npx cap sync`, `npx cap open android`

---

### **Service Workers (PWA)**
**Função:** Tecnologia que permite cache offline e instalação como app.

**Uso no Sistema:**
- Cache de assets para funcionamento offline
- Instalação como Progressive Web App
- Atualizações automáticas
- Melhor performance em dispositivos móveis

---

## 🛠️ Ferramentas de Desenvolvimento

### **ESLint 9.9.1**
**Função:** Linter para identificar e corrigir problemas no código JavaScript/TypeScript.

**Uso no Sistema:**
- Validação de código React
- Regras para hooks (`react-hooks`, `react-refresh`)
- TypeScript ESLint para type checking
- Prevenção de bugs comuns

---

### **PostCSS 8.4.35 + Autoprefixer 10.4.18**
**Função:** Processador CSS que adiciona vendor prefixes automaticamente.

**Uso no Sistema:**
- Processamento de Tailwind CSS
- Adição automática de prefixes para compatibilidade
- Otimização de CSS final

---

## 📦 Estrutura de Pastas

```
src/
├── components/          # Componentes React
│   ├── diary-types/     # Visualizações específicas de cada tipo de diário
│   ├── Dashboard.tsx    # Página principal
│   ├── DiariesList.tsx  # Lista de diários
│   ├── NewDiary.tsx     # Criação de novos diários
│   └── ...
├── contexts/            # Context API (Auth, Toast)
├── hooks/               # Custom hooks
├── lib/                 # Configurações (Supabase client)
├── types/               # Definições TypeScript
├── utils/               # Funções utilitárias
│   ├── pdf.ts          # Lógica de geração de PDF
│   ├── excel.ts        # Exportação Excel
│   └── csv.ts          # Exportação CSV
└── data/                # Dados estáticos (estados/cidades)
```

---

## 🔄 Fluxo de Dados

### **1. Autenticação**
```
LoginPage → AuthContext → Supabase Auth → Session → Protected Routes
```

### **2. Criação de Diário**
```
NewDiary → Form Components → Validation → Supabase Insert → Success Toast
```

### **3. Geração de PDF**
```
DiariesList → DiaryPDFLayout → Componente específico (PIT/PCE/etc) → 
html2canvas → jsPDF → Download
```

### **4. Exportação**
```
DiariesList → Utils (excel/csv) → Download direto
```

---

## 🎯 Funcionalidades Principais Implementadas

### **1. Gerenciamento de Diários**
- CRUD completo de diários de obra
- Múltiplos tipos: PCE, PIT, PLACA, PDA
- Validação de formulários
- Autosave em localStorage

### **2. Geração de PDFs Profissionais**
- Alta resolução (300 DPI equivalente)
- Quebra de página inteligente
- Proteção de seções contra corte
- Formatação técnica e compacta
- Assinaturas digitais incluídas

### **3. Exportação de Dados**
- Excel (XLSX)
- CSV
- Filtros e busca
- Paginação

### **4. Gerenciamento de Clientes**
- CRUD de clientes
- Endereços com estados/cidades
- Validação de campos

### **5. Assinaturas Digitais**
- Captura via canvas
- Armazenamento em Supabase Storage
- Exibição em PDFs
- Fallback para localStorage

### **6. Mapas e Geolocalização**
- Visualização de equipamentos
- Marcadores interativos
- Integração com OpenStreetMap

---

## 🚀 Deploy e Build

### **Vercel / Netlify**
- Deploy automático via Git
- Variáveis de ambiente configuráveis
- Build otimizado com Vite
- CDN global para assets

### **Build de Produção**
```bash
npm run build  # Gera pasta dist/ otimizada
```

---

## 📈 Performance e Otimizações

### **Implementadas:**
- Code splitting automático (Vite)
- Lazy loading de componentes pesados
- Cache de Service Worker
- Otimização de imagens no PDF
- Queries paralelas no Supabase
- Memoização de cálculos pesados

### **Estrutura de Dados:**
- Normalização no banco de dados
- Joins eficientes
- Índices em campos de busca
- Paginação para grandes volumes

---

## 🔒 Segurança

### **Implementada:**
- Autenticação via Supabase Auth
- Row Level Security (RLS) no PostgreSQL
- Validação de dados no frontend e backend
- Sanitização de inputs
- Proteção contra XSS
- HTTPS obrigatório em produção

---

## 📝 Padrões de Código

### **Convenções:**
- Componentes funcionais com TypeScript
- Hooks customizados para lógica reutilizável
- Separação de concerns (UI, lógica, dados)
- Nomenclatura em português para domínio de negócio
- Comentários em português
- Type safety em todo o código

---

## 🎓 Conhecimentos Técnicos Demonstrados

1. **React Avançado:**
   - Hooks customizados
   - Context API
   - Renderização condicional
   - Componentes compostos

2. **TypeScript:**
   - Interfaces e tipos
   - Generics
   - Type guards
   - Tipagem de props e estados

3. **Gerenciamento de Estado:**
   - Estado local (useState)
   - Estado global (Context)
   - Estado do servidor (Supabase)

4. **Manipulação de PDFs:**
   - html2canvas avançado
   - jsPDF multi-página
   - Algoritmos de quebra de página
   - Otimização de qualidade

5. **Integração com Backend:**
   - REST APIs
   - Autenticação JWT
   - Upload de arquivos
   - Queries complexas

6. **Performance:**
   - Code splitting
   - Lazy loading
   - Otimização de renderização
   - Cache strategies

---

## 📚 Bibliotecas e Dependências Resumidas

| Biblioteca | Versão | Função Principal |
|------------|--------|------------------|
| React | 18.3.1 | Framework UI |
| TypeScript | 5.5.3 | Tipagem estática |
| Vite | 5.4.2 | Build tool |
| Tailwind CSS | 3.4.1 | Estilização |
| Supabase | 2.57.4 | Backend/Banco |
| jsPDF | 3.0.3 | Geração PDF |
| html2canvas | 1.4.1 | Captura HTML |
| Leaflet | 1.9.4 | Mapas |
| xlsx | 0.18.5 | Excel |
| react-signature-canvas | 1.1.0 | Assinaturas |

---

## 🎯 Conclusão

Este sistema demonstra conhecimento em:
- ✅ Desenvolvimento full-stack moderno
- ✅ React e TypeScript avançados
- ✅ Integração com serviços cloud (Supabase)
- ✅ Geração de documentos profissionais (PDF)
- ✅ PWA e mobile-first
- ✅ Performance e otimizações
- ✅ UX/UI responsiva
- ✅ Arquitetura escalável

---

**Documento gerado para:** Entrevista Técnica  
**Data:** 2025  
**Sistema:** Geoteste - Diários de Obra




