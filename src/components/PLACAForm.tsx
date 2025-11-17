import React from 'react';

export interface PLACATestPoint {
  nome: string;
  cargaTrabalho1KgfCm2: string;
  cargaTrabalho2KgfCm2: string;
}

export interface PLACAFormData {
  testPoints: PLACATestPoint[];
  equipamentos: {
    macaco: string;
    celulaDeRCarga: string;
    manometro: string;
    placaDimensoes: string;
    equipamentoReacao: string;
    relogios: string;
  };
  ocorrencias: string;
}

interface PLACAFormProps {
  value: PLACAFormData;
  onChange: (next: PLACAFormData) => void;
}

export const PLACAForm: React.FC<PLACAFormProps> = ({ value, onChange }) => {
  const setField = (fn: (draft: PLACAFormData) => void) => {
    // ✅ OTIMIZAÇÃO: structuredClone() é nativo e muito mais rápido que JSON.parse(JSON.stringify())
    const next: PLACAFormData = structuredClone(value);
    fn(next);
    onChange(next);
  };

  const addTestPoint = () => {
    setField((d) => {
      d.testPoints.unshift({
        nome: '',
        cargaTrabalho1KgfCm2: '',
        cargaTrabalho2KgfCm2: ''
      });
    });
  };

  const removeTestPoint = (index: number) => {
    setField((d) => {
      d.testPoints.splice(index, 1);
      if (d.testPoints.length === 0) {
        d.testPoints.push({ nome: '', cargaTrabalho1KgfCm2: '', cargaTrabalho2KgfCm2: '' });
      }
    });
  };

  const updateTestPoint = (index: number, fn: (p: PLACATestPoint) => void) => {
    setField((d) => { fn(d.testPoints[index]); });
  };

  const divider = <div className="my-4 sm:my-6 border-t border-gray-200 dark:border-gray-800" />;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="p-4 sm:p-5 md:p-6 border-b border-gray-100 dark:border-gray-800 bg-green-50 dark:bg-green-900/20">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Formulário PLACA</h2>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Preencha os campos específicos de PLACA</p>
      </div>

      <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
        {divider}

        {/* Dados do ensaio - Pontos de ensaio */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Pontos de ensaio</h3>
            <button
              type="button"
              onClick={addTestPoint}
              className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Adicionar ponto
            </button>
          </div>

          {value.testPoints.map((point, index) => (
            <div key={index} className="mb-4 sm:mb-6 border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">{point.nome?.trim() || `Ponto ${index + 1}`}</p>
                <button
                  type="button"
                  onClick={() => removeTestPoint(index)}
                  className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium"
                >
                  Remover
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Nome do ponto</label>
                  <input
                    type="text"
                    value={point.nome}
                    onChange={(e) => updateTestPoint(index, (p) => { p.nome = e.target.value; })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex.: P-01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Carga de trabalho 1 (kgf/cm²)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={point.cargaTrabalho1KgfCm2}
                    onChange={(e) => updateTestPoint(index, (p) => { p.cargaTrabalho1KgfCm2 = e.target.value; })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex.: 150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Carga de trabalho 2 (kgf/cm²)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={point.cargaTrabalho2KgfCm2}
                    onChange={(e) => updateTestPoint(index, (p) => { p.cargaTrabalho2KgfCm2 = e.target.value; })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex.: 200"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {divider}

        {/* Equipamentos utilizados */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">Equipamentos utilizados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Macaco</label>
              <input
                type="text"
                value={value.equipamentos.macaco}
                onChange={(e) => setField((d) => { d.equipamentos.macaco = e.target.value; })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex.: Macaco hidráulico 50t"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Célula de carga</label>
              <input
                type="text"
                value={value.equipamentos.celulaDeRCarga}
                onChange={(e) => setField((d) => { d.equipamentos.celulaDeRCarga = e.target.value; })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex.: Célula 100t"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Manômetro</label>
              <input
                type="text"
                value={value.equipamentos.manometro}
                onChange={(e) => setField((d) => { d.equipamentos.manometro = e.target.value; })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex.: Manômetro digital"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Placa (dimensões)</label>
              <input
                type="text"
                value={value.equipamentos.placaDimensoes}
                onChange={(e) => setField((d) => { d.equipamentos.placaDimensoes = e.target.value; })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex.: 80x80 cm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Equipamento de reação</label>
              <input
                type="text"
                value={value.equipamentos.equipamentoReacao}
                onChange={(e) => setField((d) => { d.equipamentos.equipamentoReacao = e.target.value; })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex.: Sistema de vigas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Relógios</label>
              <input
                type="text"
                value={value.equipamentos.relogios}
                onChange={(e) => setField((d) => { d.equipamentos.relogios = e.target.value; })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex.: 4 relógios comparadores"
              />
            </div>
          </div>
        </div>

        {divider}

        {/* Ocorrências */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Ocorrências</label>
          <textarea
            rows={5}
            value={value.ocorrencias}
            onChange={(e) => setField((d) => { d.ocorrencias = e.target.value; })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y"
            placeholder="Descreva as ocorrências do campo..."
          />
        </div>

        {divider}

        {/* Assinaturas: serão usadas as do formulário principal */}
        <p className="text-xs text-gray-500 dark:text-gray-400">As assinaturas serão preenchidas na seção padrão do formulário.</p>
      </div>
    </div>
  );
};

