import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, FileText, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { PCEForm, PCEFormData } from './PCEForm';
import { PITForm, PITFormData } from './PITForm';
import { PLACAForm, PLACAFormData } from './PLACAForm';
import { ClientSelector } from './ClientSelector';
import { getEstados, getCidadesByEstado, getEstadoById, getCidadeById } from '../data/estadosCidades';

interface NewDiaryProps {
  onBack: () => void;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export const NewDiary: React.FC<NewDiaryProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    type: 'PCE',
    clientName: '',
    address: '',
    team: '',
    date: '',
    startTime: '',
    endTime: '',
    servicesExecuted: '',
    geotestSignatureImage: '',
    responsibleSignature: '',
    observations: ''
  });

  const [enderecoDetalhado, setEnderecoDetalhado] = useState({
    estadoId: 0,
    cidadeId: 0,
    rua: '',
    numero: ''
  });

  const [estados] = useState(getEstados());
  const [cidades, setCidades] = useState<any[]>([]);

  const [pceData, setPceData] = useState<PCEFormData>({
    ensaioTipo: 'PCE CONVENCIONAL',
    piles: [
      { estacaNome: '', estacaProfundidadeM: '', estacaTipo: '', estacaCargaTrabalhoTf: '', estacaDiametroCm: '' }
    ],
    carregamentoTipos: [],
    equipamentos: { macaco: '', celula: '', manometro: '', relogios: '', conjuntoVigas: '' },
    ocorrencias: '',
    cravacao: { equipamento: '', horimetro: '' },
    abastecimento: {
      mobilizacao: { litrosTanque: '', litrosGalao: '' },
      finalDia: { litrosTanque: '', litrosGalao: '' },
      chegouDiesel: '',
      fornecidoPor: '',
      quantidadeLitros: '',
      horarioChegada: ''
    }
  });

  const [pitData, setPitData] = useState<PITFormData>({
    equipamento: '',
    piles: [
      { estacaNome: '', estacaTipo: '', diametroCm: '', profundidadeCm: '', arrasamentoM: '', comprimentoUtilM: '' }
    ],
    ocorrencias: '',
    totalEstacas: ''
  });

  const [placaData, setPlacaData] = useState<PLACAFormData>({
    testPoints: [
      { nome: '', cargaTrabalho1KgfCm2: '', cargaTrabalho2KgfCm2: '' }
    ],
    equipamentos: {
      macaco: '',
      celulaDeRCarga: '',
      manometro: '',
      placaDimensoes: '',
      equipamentoReacao: '',
      relogios: ''
    },
    ocorrencias: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Carregar assinatura do usuário e buscar membros da equipe e clientes
  useEffect(() => {
    const loadUserData = async () => {
      if (!isSupabaseConfigured || !user) {
        setTeamMembers([]);
        // Clientes mock para modo local
        setClients([
          { id: '1', name: 'Construtora ABC Ltda', email: 'contato@abc.com.br', phone: '(11) 3333-4444', address: 'Av. Paulista, 1000 - São Paulo, SP' },
          { id: '2', name: 'Incorporadora XYZ', email: 'projetos@xyz.com.br', phone: '(21) 5555-6666', address: 'Rua Copacabana, 200 - Rio de Janeiro, RJ' }
        ]);
        return;
      }

      setLoadingTeam(true);
      setLoadingClients(true);
      try {
        // Buscar perfil do usuário com assinatura digital
        const { data: userProfile, error: userError } = await supabase
          .from('profiles')
          .select('signature_image_url')
          .eq('id', user.id)
          .single();

        if (!userError && userProfile) {
          setFormData(prev => ({
            ...prev,
            geotestSignatureImage: userProfile.signature_image_url || ''
          }));
        }

        // Buscar clientes cadastrados
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .order('name');

        if (!clientsError && clientsData) {
          setClients(clientsData);
        }

        // Buscar todos os usuários para formar a equipe
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email')
          .order('name');

        if (error) throw error;

        const members: TeamMember[] = (data || []).map((profile: any) => ({
          id: profile.id,
          name: profile.name || 'Usuário sem nome',
          email: profile.email || 'email@exemplo.com'
        }));

        setTeamMembers(members);
      } catch (err: any) {
        console.error('Erro ao carregar dados do usuário:', err);
        setTeamMembers([]);
        setClients([]);
      } finally {
        setLoadingTeam(false);
        setLoadingClients(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleTeamMemberToggle = (memberId: string) => {
    setSelectedTeamMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const getSelectedTeamNames = () => {
    return selectedTeamMembers
      .map(id => teamMembers.find(member => member.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      if (!isSupabaseConfigured) {
        console.log('Diary saved (mock):', formData);
        setSuccess('Diário salvo (modo demonstração).');
        setIsSubmitting(false);
        onBack();
        return;
      }

      if (!user?.id) {
        setError('Usuário não autenticado. Faça login novamente.');
        setIsSubmitting(false);
        return;
      }

      // Montar endereço detalhado se preenchido
      let enderecoCompleto = formData.address.trim();
      if (enderecoDetalhado.estadoId > 0 && enderecoDetalhado.cidadeId > 0) {
        const estado = getEstadoById(enderecoDetalhado.estadoId);
        const cidade = getCidadeById(enderecoDetalhado.estadoId, enderecoDetalhado.cidadeId);
        
        if (estado && cidade) {
          const enderecoDetalhadoText = `${enderecoDetalhado.rua.trim()}, ${enderecoDetalhado.numero.trim()}, ${cidade.nome}, ${estado.nome}`;
          enderecoCompleto = enderecoDetalhadoText;
        }
      }

      const payload = {
        user_id: user.id,
        diary_type: formData.type,
        client_name: formData.clientName.trim(),
        address: enderecoCompleto,
        endereco_detalhado: enderecoDetalhado.estadoId > 0 ? {
          estado_id: enderecoDetalhado.estadoId,
          estado_nome: getEstadoById(enderecoDetalhado.estadoId)?.nome || '',
          cidade_id: enderecoDetalhado.cidadeId,
          cidade_nome: getCidadeById(enderecoDetalhado.estadoId, enderecoDetalhado.cidadeId)?.nome || '',
          rua: enderecoDetalhado.rua.trim(),
          numero: enderecoDetalhado.numero.trim()
        } : null,
        team: getSelectedTeamNames() || formData.team.trim(), // Usar nomes selecionados ou fallback para input manual
        date: formData.date, // yyyy-mm-dd
        start_time: formData.startTime,
        end_time: formData.endTime,
        services_executed: formData.servicesExecuted.trim(),
        geotest_signature: user?.name || 'Responsável Geoteste', // Usar nome do usuário como assinatura em texto
        geotest_signature_url: formData.geotestSignatureImage || null,
        responsible_signature: formData.responsibleSignature.trim(),
        observations: formData.observations.trim() || null,
      };

      // 1) Cria o diário base e obtém o id
      const { data: diaryRows, error: insertError } = await supabase
        .from('work_diaries')
        .insert(payload)
        .select('id')
        .single();
      if (insertError) {
        setError(insertError.message);
        setIsSubmitting(false);
        return;
      }

      const diaryId = diaryRows?.id;

      // 2) Se for PCE, cria registro PCE e, em seguida, as estacas (piles)
      if (formData.type === 'PCE' && diaryId) {
        const pcePayload: any = {
          diary_id: diaryId,
          ensaio_tipo: pceData.ensaioTipo,
          carregamento_tipos: pceData.carregamentoTipos,
          equipamentos_macaco: pceData.equipamentos.macaco || null,
          equipamentos_celula: pceData.equipamentos.celula || null,
          equipamentos_manometro: pceData.equipamentos.manometro || null,
          equipamentos_relogios: pceData.equipamentos.relogios || null,
          equipamentos_conjunto_vigas: pceData.equipamentos.conjuntoVigas || null,
          ocorrencias: pceData.ocorrencias || null,
          cravacao_equipamento: pceData.cravacao.equipamento || null,
          cravacao_horimetro: pceData.cravacao.horimetro || null,
          abastecimento_mobilizacao_litros_tanque: pceData.abastecimento.mobilizacao.litrosTanque || null,
          abastecimento_mobilizacao_litros_galao: pceData.abastecimento.mobilizacao.litrosGalao || null,
          abastecimento_finaldia_litros_tanque: pceData.abastecimento.finalDia.litrosTanque || null,
          abastecimento_finaldia_litros_galao: pceData.abastecimento.finalDia.litrosGalao || null,
          abastecimento_chegou_diesel: pceData.abastecimento.chegouDiesel === '' ? null : pceData.abastecimento.chegouDiesel === 'Sim',
          abastecimento_fornecido_por: pceData.abastecimento.fornecidoPor || null,
          abastecimento_quantidade_litros: pceData.abastecimento.quantidadeLitros || null,
          abastecimento_horario_chegada: pceData.abastecimento.horarioChegada || null,
        };

        const { data: pceRow, error: pceError } = await supabase
          .from('work_diaries_pce')
          .insert(pcePayload)
          .select('id')
          .single();
        if (pceError) {
          setError(pceError.message);
          setIsSubmitting(false);
          return;
        }

        const pceId = (pceRow as any)?.id;

        if (pceId && pceData.piles && pceData.piles.length > 0) {
          const pilesPayload = pceData.piles.map((pile, idx) => ({
            pce_id: pceId,
            ordem: idx + 1,
            estaca_nome: pile.estacaNome || null,
            estaca_profundidade_m: pile.estacaProfundidadeM || null,
            estaca_tipo: pile.estacaTipo || null,
            estaca_carga_trabalho_tf: pile.estacaCargaTrabalhoTf || null,
            estaca_diametro_cm: pile.estacaDiametroCm || null,
          }));

          // compatibilidade com nome da coluna pce_id na SQL criada
          // a tabela está como work_diaries_pce_piles(pce_id ...)
          const mapped = pilesPayload.map((p) => ({
            pce_id: p.pce_id,
            ordem: p.ordem,
            estaca_nome: p.estaca_nome,
            estaca_profundidade_m: p.estaca_profundidade_m,
            estaca_tipo: p.estaca_tipo,
            estaca_carga_trabalho_tf: p.estaca_carga_trabalho_tf,
            estaca_diametro_cm: p.estaca_diametro_cm,
          }));

          const { error: pilesError } = await supabase
            .from('work_diaries_pce_piles')
            .insert(mapped);
          if (pilesError) {
            setError(pilesError.message);
            setIsSubmitting(false);
            return;
          }
        }
      }

      // 3) Se for PIT, cria registro PIT e estacas
      if (formData.type === 'PIT' && diaryId) {
        const pitPayload: any = {
          diary_id: diaryId,
          equipamento: pitData.equipamento || null,
          ocorrencias: pitData.ocorrencias || null,
          total_estacas: pitData.totalEstacas ? Number(pitData.totalEstacas) : null,
        };

        const { data: pitRow, error: pitError } = await supabase
          .from('work_diaries_pit')
          .insert(pitPayload)
          .select('id')
          .single();
        if (pitError) {
          setError(pitError.message);
          setIsSubmitting(false);
          return;
        }

        const pitId = (pitRow as any)?.id;
        if (pitId && pitData.piles && pitData.piles.length > 0) {
          const piles = pitData.piles.map((pile, idx) => ({
            pit_id: pitId,
            ordem: idx + 1,
            estaca_nome: pile.estacaNome || null,
            estaca_tipo: pile.estacaTipo || null,
            diametro_cm: pile.diametroCm || null,
            profundidade_cm: pile.profundidadeCm || null,
            arrasamento_m: pile.arrasamentoM || null,
            comprimento_util_m: pile.comprimentoUtilM || null,
          }));

          const { error: pitPilesError } = await supabase
            .from('work_diaries_pit_piles')
            .insert(piles);
          if (pitPilesError) {
            setError(pitPilesError.message);
            setIsSubmitting(false);
            return;
          }
        }
      }

      // 4) Se for PLACA, cria registro PLACA e pontos de ensaio
      if (formData.type === 'PLACA' && diaryId) {
        const placaPayload: any = {
          diary_id: diaryId,
          equipamentos_macaco: placaData.equipamentos.macaco || null,
          equipamentos_celula_carga: placaData.equipamentos.celulaDeRCarga || null,
          equipamentos_manometro: placaData.equipamentos.manometro || null,
          equipamentos_placa_dimensoes: placaData.equipamentos.placaDimensoes || null,
          equipamentos_equipamento_reacao: placaData.equipamentos.equipamentoReacao || null,
          equipamentos_relogios: placaData.equipamentos.relogios || null,
          ocorrencias: placaData.ocorrencias || null,
        };

        const { data: placaRow, error: placaError } = await supabase
          .from('work_diaries_placa')
          .insert(placaPayload)
          .select('id')
          .single();
        if (placaError) {
          setError(placaError.message);
          setIsSubmitting(false);
          return;
        }

        const placaId = (placaRow as any)?.id;
        if (placaId && placaData.testPoints && placaData.testPoints.length > 0) {
          const testPoints = placaData.testPoints.map((point, idx) => ({
            placa_id: placaId,
            ordem: idx + 1,
            nome: point.nome || null,
            carga_trabalho_1_kgf_cm2: point.cargaTrabalho1KgfCm2 || null,
            carga_trabalho_2_kgf_cm2: point.cargaTrabalho2KgfCm2 || null,
          }));

          const { error: testPointsError } = await supabase
            .from('work_diaries_placa_piles')
            .insert(testPoints);
          if (testPointsError) {
            setError(testPointsError.message);
            setIsSubmitting(false);
            return;
          }
        }
      }

      setSuccess('Diário salvo com sucesso.');
      setIsSubmitting(false);
      onBack();
    } catch (err: any) {
      setError('Não foi possível salvar o diário.');
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEstadoChange = (estadoId: number) => {
    setEnderecoDetalhado(prev => ({
      ...prev,
      estadoId,
      cidadeId: 0 // Reset cidade quando muda estado
    }));
    
    if (estadoId > 0) {
      const cidadesDoEstado = getCidadesByEstado(estadoId);
      setCidades(cidadesDoEstado);
    } else {
      setCidades([]);
    }
  };

  const handleEnderecoChange = (field: string, value: string | number) => {
    setEnderecoDetalhado(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-0">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <button
          onClick={onBack}
          className="flex items-center text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 px-2 py-1 rounded-lg font-medium mb-2 sm:mb-3 md:mb-4 transition-all duration-200 hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
          <span className="text-sm sm:text-base">Voltar</span>
        </button>
        
        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
            <FileText className="text-white w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Novo Diário de Obra</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300">Registre os detalhes dos serviços executados</p>
          </div>
        </div>
      </div>

      {/* Mensagens de erro e sucesso */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-4 sm:p-5 md:p-6 border-b border-gray-100 dark:border-gray-800 bg-green-50 dark:bg-green-900/20">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
              Informações Básicas
            </h2>
          </div>
          
          <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Tipo do Diário *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['PCE','PLACA','PIT','PDA'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange('type', opt)}
                    className={`${formData.type === opt ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700'} px-3 py-2 rounded-lg font-medium hover:scale-105 transition-all`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Cliente *
                </label>
                {loadingClients ? (
                  <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Carregando clientes...
                  </div>
                ) : (
                  <>
                    <ClientSelector
                      clients={clients}
                      value={formData.clientName}
                      onChange={(value) => handleChange('clientName', value)}
                      loading={loadingClients}
                      required
                    />
                    {clients.length === 0 && (
                      <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                        Nenhum cliente cadastrado. {user?.role === 'admin' && 'Cadastre clientes na seção "Clientes".'}
                      </p>
                    )}
                  </>
                )}
              </div>
              
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Equipe *
              </label>
              
              {loadingTeam ? (
                <div className="flex items-center justify-center py-8 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Carregando membros da equipe...</span>
                </div>
              ) : teamMembers.length > 0 ? (
                <div className="space-y-3">
                  {/* Mostrar membros selecionados */}
                  {selectedTeamMembers.length > 0 && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                        Membros selecionados ({selectedTeamMembers.length}):
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {getSelectedTeamNames()}
                      </p>
                    </div>
                  )}
                  
                  {/* Lista de membros disponíveis */}
                  <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950">
                    {teamMembers.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeamMembers.includes(member.id)}
                          onChange={() => handleTeamMemberToggle(member.id)}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {member.email}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {/* Removido input manual de membros */}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Nenhum usuário encontrado para montar a equipe.
                  </p>
                </div>
              )}
            </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Endereço *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  rows={2}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Endereço completo da obra (ou use os campos detalhados abaixo)"
                  required
                />
              </div>
            </div>

            {/* Endereço Detalhado */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                Endereço Detalhado (Opcional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Estado
                  </label>
                  <select
                    value={enderecoDetalhado.estadoId}
                    onChange={(e) => handleEstadoChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  >
                    <option value={0}>Selecione o estado</option>
                    {estados.map((estado) => (
                      <option key={estado.id} value={estado.id}>
                        {estado.nome} ({estado.sigla})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Cidade
                  </label>
                  <select
                    value={enderecoDetalhado.cidadeId}
                    onChange={(e) => handleEnderecoChange('cidadeId', Number(e.target.value))}
                    disabled={enderecoDetalhado.estadoId === 0}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value={0}>Selecione a cidade</option>
                    {cidades.map((cidade) => (
                      <option key={cidade.id} value={cidade.id}>
                        {cidade.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Rua
                  </label>
                  <input
                    type="text"
                    value={enderecoDetalhado.rua}
                    onChange={(e) => handleEnderecoChange('rua', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="Nome da rua"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    value={enderecoDetalhado.numero}
                    onChange={(e) => handleEnderecoChange('numero', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="Número"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Data *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Início *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleChange('startTime', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Término *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleChange('endTime', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {formData.type === 'PCE' && (
          <div className="mt-6">
            <PCEForm value={pceData} onChange={setPceData} />
          </div>
        )}

        {formData.type === 'PLACA' && (
          <div className="mt-6">
            <PLACAForm value={placaData} onChange={setPlacaData} />
          </div>
        )}

        {formData.type === 'PIT' && (
          <div className="mt-6">
            <PITForm value={pitData} onChange={setPitData} />
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-4 sm:p-5 md:p-6 border-b border-gray-100 dark:border-gray-800 bg-green-50 dark:bg-green-900/20">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Serviços e Assinaturas</h2>
          </div>
          
          <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Serviços Executados *
              </label>
              <textarea
                value={formData.servicesExecuted}
                onChange={(e) => handleChange('servicesExecuted', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                placeholder="Descreva detalhadamente os serviços executados no dia..."
                required
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Assinatura Geoteste *
                </label>
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Responsável: <span className="font-medium text-gray-900 dark:text-white">{user?.name || 'Usuário'}</span>
                    </p>
                    {formData.geotestSignatureImage ? (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sua assinatura digital será incluída:</p>
                        <div className="w-full h-40 bg-white border border-gray-300 dark:border-gray-600 rounded flex items-center justify-center">
                          <img
                            src={formData.geotestSignatureImage}
                            alt="Assinatura digital"
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          ⚠️ Você ainda não possui uma assinatura digital. 
                          <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); window.location.href = '#profile'; }}
                            className="text-yellow-800 dark:text-yellow-200 underline ml-1"
                          >
                            Configure sua assinatura no perfil
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                  {formData.geotestSignatureImage && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Assinatura digital carregada automaticamente do seu perfil
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Assinatura Responsável da Obra *
                </label>
                <input
                  type="text"
                  value={formData.responsibleSignature}
                  onChange={(e) => handleChange('responsibleSignature', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Nome do responsável pela obra"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Observações
              </label>
              <textarea
                value={formData.observations}
                onChange={(e) => handleChange('observations', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                placeholder="Observações adicionais, condições do solo, intercorrências, etc."
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-3 md:space-x-4 py-4 sm:py-5 md:py-6">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:scale-105 transition-all duration-200"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 hover:shadow-lg hover:scale-105 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">{isSubmitting ? 'Salvando...' : 'Salvar Diário'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};