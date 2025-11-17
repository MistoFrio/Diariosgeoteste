import React, { useEffect, useRef, useState } from 'react';
import { Search, Calendar, Clock, User, MapPin, FileText, Eye, Edit, Trash2, Download, FileSpreadsheet } from 'lucide-react';
import { WorkDiary } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { exportElementToPDF } from '../utils/pdf';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { downloadCsv, mapDiaryToCsvRow } from '../utils/csv';
import { downloadExcel, mapDiaryToExcelRow } from '../utils/excel';
import { DiaryListSkeleton, Spinner } from './SkeletonLoader';
import ConfirmDialog from './ConfirmDialog';
import EmptyState from './EmptyState';
import Pagination from './Pagination';
import { DiaryPDFLayout } from './DiaryPDFLayout';

// Tipagem local para exibição
type DiaryRow = WorkDiary;

interface DiariesListProps {
  onNewDiary: () => void;
}

export const DiariesList: React.FC<DiariesListProps> = ({ onNewDiary }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedDiary, setSelectedDiary] = useState<DiaryRow | null>(null);
  const [rows, setRows] = useState<DiaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pceDetail, setPceDetail] = useState<any | null>(null);
  const [pcePiles, setPcePiles] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [pitDetail, setPitDetail] = useState<any | null>(null);
  const [pitPiles, setPitPiles] = useState<any[]>([]);
  const [placaDetail, setPlacaDetail] = useState<any | null>(null);
  const [placaPiles, setPlacaPiles] = useState<any[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    diary: DiaryRow | null;
  }>({ isOpen: false, diary: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Detalhes PDA (ficha técnica) e Diário PDA
  const [fichapdaDetail, setFichapdaDetail] = useState<any | null>(null);
  const [pdaDiarioDetail, setPdaDiarioDetail] = useState<any | null>(null);
  const [pdaDiarioPiles, setPdaDiarioPiles] = useState<any[]>([]);

  const filteredDiaries = rows.filter((diary) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesQuery =
      term.length === 0 ||
      diary.clientName.toLowerCase().includes(term) ||
      diary.address.toLowerCase().includes(term) ||
      diary.servicesExecuted.toLowerCase().includes(term);

    // Filtro de cliente
    const matchesClient = clientFilter === '' || diary.clientName === clientFilter;

    // Filtro de tipo de diário (PCE, PIT, PLACA, PDA)
    const matchesType = typeFilter === '' || diary.type === typeFilter;

    // Datas no formato YYYY-MM-DD permitem comparação lexicográfica simples
    const d = diary.date;
    const afterStart = startDate ? d >= startDate : true;
    const beforeEnd = endDate ? d <= endDate : true;
    const withinRange = afterStart && beforeEnd;

    return matchesQuery && matchesClient && matchesType && withinRange;
  });

  // Lista única de clientes para o filtro
  const uniqueClients = Array.from(new Set(rows.map(d => d.clientName))).sort();

  // Paginação
  const totalPages = Math.ceil(filteredDiaries.length / itemsPerPage);
  const paginatedDiaries = filteredDiaries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset para página 1 quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, clientFilter, typeFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Função para exportar para Excel com dados completos
  const handleExportExcel = async () => {
    if (filteredDiaries.length === 0) {
      toast.warning('Não há diários para exportar com os filtros aplicados');
      return;
    }

    if (!isSupabaseConfigured) {
      // Modo local - exportar sem detalhes específicos
      const excelRows = filteredDiaries.map(mapDiaryToExcelRow);
      const fileName = `Diarios_${new Date().toISOString().split('T')[0]}`;
      downloadExcel(fileName, excelRows);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Buscar detalhes específicos para cada diário
      const diariesWithDetails = await Promise.all(
        filteredDiaries.map(async (diary) => {
          let pceDetail = null;
          let pcePiles: any[] = [];
          let pitDetail = null;
          let pitPiles: any[] = [];
          let placaDetail = null;
          let placaPiles: any[] = [];

          // Buscar dados específicos de PCE
          if (diary.type === 'PCE') {
            const { data: pce } = await supabase
              .from('work_diaries_pce')
              .select('*')
              .eq('diary_id', diary.id)
              .maybeSingle();
            
            pceDetail = pce;
            
            if (pce?.id) {
              const { data: piles } = await supabase
                .from('work_diaries_pce_piles')
                .select('*')
                .eq('pce_id', pce.id)
                .order('ordem', { ascending: true });
              pcePiles = piles || [];
            }
          }

          // Buscar dados específicos de PIT
          if (diary.type === 'PIT') {
            const { data: pit } = await supabase
              .from('work_diaries_pit')
              .select('*')
              .eq('diary_id', diary.id)
              .maybeSingle();
            
            pitDetail = pit;
            
            if (pit?.id) {
              const { data: piles } = await supabase
                .from('work_diaries_pit_piles')
                .select('*')
                .eq('pit_id', pit.id)
                .order('ordem', { ascending: true });
              pitPiles = piles || [];
            }
          }

          // Buscar dados específicos de PLACA
          if (diary.type === 'PLACA') {
            const { data: placa } = await supabase
              .from('work_diaries_placa')
              .select('*')
              .eq('diary_id', diary.id)
              .maybeSingle();
            
            placaDetail = placa;
            
            if (placa?.id) {
              const { data: piles } = await supabase
                .from('work_diaries_placa_piles')
                .select('*')
                .eq('placa_id', placa.id)
                .order('ordem', { ascending: true });
              placaPiles = piles || [];
            }
          }

          return {
            ...diary,
            pceDetail,
            pcePiles,
            pitDetail,
            pitPiles,
            placaDetail,
            placaPiles,
          };
        })
      );

      // Mapear para linhas do Excel
      const excelRows = diariesWithDetails.map(mapDiaryToExcelRow);
      const fileName = `Diarios_${new Date().toISOString().split('T')[0]}`;
      downloadExcel(fileName, excelRows);
    } catch (err: any) {
      console.error('Erro ao exportar:', err);
      setError('Erro ao exportar diários: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (time: string) => {
    return time;
  };

  const detailsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchDiaries = async () => {
      if (!user) return;
      setLoading(true);
      setError('');

      // Se não houver Supabase, mantém tudo vazio
      if (!isSupabaseConfigured) {
        setRows([]);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Buscando diários para usuário:', user?.email, 'Role:', user?.role);
        
        let query = supabase
          .from('work_diaries')
          .select('*')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });

        // Todos os usuários podem ver todos os diários
        console.log('📋 Query configurada para buscar todos os diários');

        // Filtros de data no servidor para reduzir payload
        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        // Filtro textual básico no servidor (ilike OR)
        const term = searchTerm.trim();
        if (term) {
          const like = `%${term}%`;
          query = query.or(
            `client_name.ilike.${like},address.ilike.${like},services_executed.ilike.${like}`
          );
        }

        const { data, error } = await query;
        console.log('📊 Resultado da query:', { data: data?.length, error });
        if (error) {
          console.error('❌ Erro na query:', error);
          throw error;
        }

        // Buscar assinaturas dos usuários que criaram os diários
        const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, signature_image_url')
          .in('id', userIds);

        const profilesMap = new Map();
        (profilesData || []).forEach((profile: any) => {
          profilesMap.set(profile.id, profile);
        });

        // Detectar tipo pelo relacionamento (fallback caso diary_type esteja vazio)
        const diaryIds = (data || []).map((r: any) => r.id);
        let pceByDiary = new Set<string>();
        let pitByDiary = new Set<string>();
        let placaByDiary = new Set<string>();
        try {
          if (diaryIds.length > 0) {
            const [{ data: pceList }, { data: pitList }, { data: placaList }] = await Promise.all([
              supabase.from('work_diaries_pce').select('diary_id').in('diary_id', diaryIds),
              supabase.from('work_diaries_pit').select('diary_id').in('diary_id', diaryIds),
              supabase.from('work_diaries_placa').select('diary_id').in('diary_id', diaryIds),
            ]);
            pceByDiary = new Set((pceList || []).map((x: any) => x.diary_id));
            pitByDiary = new Set((pitList || []).map((x: any) => x.diary_id));
            placaByDiary = new Set((placaList || []).map((x: any) => x.diary_id));
          }
        } catch (relErr) {
          console.warn('Não foi possível detectar tipos pelos relacionamentos:', relErr);
        }

        const mapped: DiaryRow[] = (data || []).map((r: any) => {
          const profile = profilesMap.get(r.user_id);
          let inferredType: string | undefined = r.diary_type || undefined;
          if (!inferredType) {
            if (placaByDiary.has(r.id)) inferredType = 'PLACA';
            else if (pitByDiary.has(r.id)) inferredType = 'PIT';
            else if (pceByDiary.has(r.id)) inferredType = 'PCE';
          }
          return {
            id: r.id,
            clientId: r.user_id,
            clientName: r.client_name,
            address: r.address,
            enderecoDetalhado: r.endereco_detalhado || undefined,
            team: r.team,
            type: inferredType as any,
            date: r.date,
            startTime: r.start_time,
            endTime: r.end_time,
            servicesExecuted: r.services_executed,
            geotestSignature: r.geotest_signature,
            geotestSignatureImage: profile?.signature_image_url || '',
            responsibleSignature: r.responsible_signature,
            observations: r.observations || '',
            createdBy: profile?.name || user.name || '',
            createdAt: r.created_at,
          };
        });

        // Garantir ordenação: mais recente no topo (createdAt desc, fallback date desc)
        mapped.sort((a: any, b: any) => {
          const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (aCreated !== bCreated) return bCreated - aCreated;
          const aDate = a.date ? new Date(a.date).getTime() : 0;
          const bDate = b.date ? new Date(b.date).getTime() : 0;
          return bDate - aDate;
        });

        setRows(mapped);
      } catch (err: any) {
        setError('Não foi possível carregar os diários.');
      } finally {
        setLoading(false);
      }
    };

    fetchDiaries();
  }, [user, startDate, endDate, searchTerm]);


  // Carregar dados específicos (PCE, PIT, PLACA) quando abrir um diário
  useEffect(() => {
    const fetchDetail = async () => {
      if (!selectedDiary || !isSupabaseConfigured) {
        setPceDetail(null);
        setPcePiles([]);
        setPitDetail(null);
        setPitPiles([]);
        setPlacaDetail(null);
        setPlacaPiles([]);
        return;
      }
      setLoadingDetail(true);
      try {
        const diaryId = selectedDiary.id;
        const diaryType = selectedDiary.type;

        // ✅ OTIMIZAÇÃO: Executar todas as queries principais em PARALELO
        const [
          pceResult,
          pitResult,
          placaResult,
          fichaResult,
          pdaDiarioResult
        ] = await Promise.all([
          // PCE
          supabase
            .from('work_diaries_pce')
            .select('id, ensaio_tipo, carregamento_tipos, equipamentos_macaco, equipamentos_celula, equipamentos_manometro, equipamentos_relogios, equipamentos_conjunto_vigas, ocorrencias, cravacao_equipamento, cravacao_horimetro, abastecimento_mobilizacao_litros_tanque, abastecimento_mobilizacao_litros_galao, abastecimento_finaldia_litros_tanque, abastecimento_finaldia_litros_galao, abastecimento_chegou_diesel, abastecimento_fornecido_por, abastecimento_quantidade_litros, abastecimento_horario_chegada')
            .eq('diary_id', diaryId)
            .maybeSingle(),
          // PIT
          supabase
            .from('work_diaries_pit')
            .select('id, equipamento, ocorrencias, total_estacas')
            .eq('diary_id', diaryId)
            .maybeSingle(),
          // PLACA (apenas se for tipo PLACA)
          diaryType === 'PLACA'
            ? supabase
                .from('work_diaries_placa')
                .select('id, equipamentos_macaco, equipamentos_celula_carga, equipamentos_manometro, equipamentos_placa_dimensoes, equipamentos_equipamento_reacao, equipamentos_relogios, ocorrencias')
                .eq('diary_id', diaryId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          // Ficha PDA
          supabase
            .from('fichapda')
            .select('*')
            .eq('diary_id', diaryId)
            .maybeSingle(),
          // Diário PDA
          supabase
            .from('work_diaries_pda_diario')
            .select('id, pda_computadores, ocorrencias, abastec_equipamentos, horimetro_horas, mobilizacao_litros_tanque, mobilizacao_litros_galao, finaldia_litros_tanque, finaldia_litros_galao, entrega_chegou_diesel, entrega_fornecido_por, entrega_quantidade_litros, entrega_horario_chegada')
            .eq('diary_id', diaryId)
            .maybeSingle()
        ]);

        // Verificar erros das queries principais
        if (pceResult.error) throw pceResult.error;
        if (pitResult.error) throw pitResult.error;
        if (placaResult.error) throw placaResult.error;
        if (fichaResult.error) throw fichaResult.error;
        if (pdaDiarioResult.error) throw pdaDiarioResult.error;

        // Atualizar estados principais
        const pce = pceResult.data;
        const pit = pitResult.data;
        const placa = placaResult.data;
        const ficha = fichaResult.data;
        const pdaDiario = pdaDiarioResult.data;

        setPceDetail(pce || null);
        setPitDetail(pit || null);
        setPlacaDetail(placa || null);
        setFichapdaDetail(ficha || null);
        setPdaDiarioDetail(pdaDiario || null);

        // ✅ OTIMIZAÇÃO: Executar todas as queries de piles em PARALELO
        const pileQueries = [];

        if (pce?.id) {
          pileQueries.push(
            supabase
              .from('work_diaries_pce_piles')
              .select('id, ordem, estaca_nome, estaca_profundidade_m, estaca_tipo, estaca_carga_trabalho_tf, estaca_diametro_cm')
              .eq('pce_id', pce.id)
              .order('ordem', { ascending: true })
              .then(result => ({ type: 'pce', ...result }))
          );
        } else {
          setPcePiles([]);
        }

        if (pit?.id) {
          pileQueries.push(
            supabase
              .from('work_diaries_pit_piles')
              .select('id, ordem, estaca_nome, estaca_tipo, diametro_cm, profundidade_cm, arrasamento_m, comprimento_util_m')
              .eq('pit_id', pit.id)
              .order('ordem', { ascending: true })
              .then(result => ({ type: 'pit', ...result }))
          );
        } else {
          setPitPiles([]);
        }

        if (placa?.id) {
          pileQueries.push(
            supabase
              .from('work_diaries_placa_piles')
              .select('id, ordem, nome, carga_trabalho_1_kgf_cm2, carga_trabalho_2_kgf_cm2')
              .eq('placa_id', placa.id)
              .order('ordem', { ascending: true })
              .then(result => ({ type: 'placa', ...result }))
          );
        } else {
          setPlacaPiles([]);
        }

        if (pdaDiario?.id) {
          pileQueries.push(
            supabase
              .from('work_diaries_pda_diario_piles')
              .select('id, ordem, nome, tipo, diametro_cm, profundidade_m, carga_trabalho_tf, carga_ensaio_tf')
              .eq('pda_diario_id', pdaDiario.id)
              .order('ordem', { ascending: true })
              .then(result => ({ type: 'pda', ...result }))
          );
        } else {
          setPdaDiarioPiles([]);
        }

        // Executar todas as queries de piles em paralelo
        if (pileQueries.length > 0) {
          const pileResults = await Promise.all(pileQueries);

          // Processar resultados e atualizar estados
          for (const result of pileResults) {
            if (result.error) throw result.error;

            switch (result.type) {
              case 'pce':
                setPcePiles(result.data || []);
                break;
              case 'pit':
                setPitPiles(result.data || []);
                break;
              case 'placa':
                setPlacaPiles(result.data || []);
                break;
              case 'pda':
                setPdaDiarioPiles(result.data || []);
                break;
            }
          }
        }
      } catch (e: any) {
        console.error('Erro ao carregar detalhes do diário:', e);
        setPceDetail(null);
        setPcePiles([]);
        setPitDetail(null);
        setPitPiles([]);
        setPlacaDetail(null);
        setPlacaPiles([]);
        setFichapdaDetail(null);
        setPdaDiarioDetail(null);
        setPdaDiarioPiles([]);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [selectedDiary]);

  const handleExport = async () => {
    if (!detailsRef.current || !selectedDiary) return;
    const safeClient = selectedDiary.clientName.replace(/[^a-z0-9\-\_\s]/gi, '').replace(/\s+/g, '-');
    const fileName = `diario-${safeClient}-${selectedDiary.date}.pdf`;
    await exportElementToPDF(detailsRef.current, fileName, {
      title: `Diário de Obra • ${selectedDiary.clientName}`,
      logoUrl: '/logogeoteste.png',
      headerBgColor: '#ECFDF5',
      marginMm: 12,
      showHeader: false,
    });
  };

  const handleExportCsvOne = () => {
    if (!selectedDiary) return;
    const safeClient = selectedDiary.clientName.replace(/[^a-z0-9\-\_\s]/gi, '').replace(/\s+/g, '-');
    const fileName = `diario-${safeClient}-${selectedDiary.date}.csv`;
    downloadCsv(fileName, [mapDiaryToCsvRow(selectedDiary)]);
  };

  const handleDeleteClick = (diary: DiaryRow) => {
    setConfirmDialog({ isOpen: true, diary });
  };

  const handleDeleteDiary = async () => {
    const diary = confirmDialog.diary;
    if (!diary) return;

    if (!isSupabaseConfigured) {
      toast.error('Supabase não está configurado.');
      setConfirmDialog({ isOpen: false, diary: null });
      return;
    }

    try {
      setLoading(true);
      console.log('🗑️ Excluindo diário:', diary.id);

      // Deletar registros relacionados primeiro (devido às foreign keys)
      if (diary.type === 'PCE') {
        // Buscar o ID do registro PCE
        const { data: pceData } = await supabase
          .from('work_diaries_pce')
          .select('id')
          .eq('diary_id', diary.id)
          .maybeSingle();
        
        if (pceData?.id) {
          // Deletar as estacas do PCE primeiro
          await supabase.from('work_diaries_pce_piles').delete().eq('pce_id', pceData.id);
          // Deletar o registro PCE
          await supabase.from('work_diaries_pce').delete().eq('diary_id', diary.id);
        }
      } else if (diary.type === 'PIT') {
        // Buscar o ID do registro PIT
        const { data: pitData } = await supabase
          .from('work_diaries_pit')
          .select('id')
          .eq('diary_id', diary.id)
          .maybeSingle();
        
        if (pitData?.id) {
          // Deletar as estacas do PIT primeiro
          await supabase.from('work_diaries_pit_piles').delete().eq('pit_id', pitData.id);
          // Deletar o registro PIT
          await supabase.from('work_diaries_pit').delete().eq('diary_id', diary.id);
        }
      } else if (diary.type === 'PLACA') {
        // Buscar o ID do registro PLACA
        const { data: placaData } = await supabase
          .from('work_diaries_placa')
          .select('id')
          .eq('diary_id', diary.id)
          .maybeSingle();
        
        if (placaData?.id) {
          // Deletar os pontos de ensaio da PLACA primeiro
          await supabase.from('work_diaries_placa_piles').delete().eq('placa_id', placaData.id);
          // Deletar o registro PLACA
          await supabase.from('work_diaries_placa').delete().eq('diary_id', diary.id);
        }
      }

      // Finalmente, deletar o diário principal
      const { error } = await supabase
        .from('work_diaries')
        .delete()
        .eq('id', diary.id);

      if (error) {
        console.error('❌ Erro ao excluir diário:', error);
        throw error;
      }

      console.log('✅ Diário excluído com sucesso');
      
      // Atualizar a lista removendo o diário excluído
      setRows((prevRows) => prevRows.filter((r) => r.id !== diary.id));
      
      toast.success('Diário excluído com sucesso!');
    } catch (err: any) {
      console.error('Erro ao excluir diário:', err);
      toast.error('Erro ao excluir o diário. Por favor, tente novamente.');
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, diary: null });
    }
  };

  const handleEditDiary = (diary: DiaryRow) => {
    toast.info('Funcionalidade de edição em desenvolvimento. Em breve você poderá editar os diários existentes.');
    // TODO: Implementar navegação para página de edição
    // ou abrir modal de edição
  };

  if (selectedDiary) {
    return (
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="mb-3 sm:mb-4 lg:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <button
            onClick={() => setSelectedDiary(null)}
            className="text-green-600 hover:text-green-700 font-medium text-sm sm:text-base flex items-center gap-2 self-start"
          >
            <span className="text-lg">←</span>
            <span>Voltar à lista</span>
          </button>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Exportar PDF</span>
            </button>
            <button
              onClick={handleExportCsvOne}
              className="bg-white border border-gray-300 text-gray-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base"
              title="Exportar para Excel (CSV)"
            >
              CSV
            </button>
          </div>
        </div>

        {/* Diary Details - Container responsivo */}
        <div ref={detailsRef} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden w-full">
          <DiaryPDFLayout
            diary={selectedDiary}
            pceDetail={pceDetail}
            pcePiles={pcePiles}
            pitDetail={pitDetail}
            pitPiles={pitPiles}
            placaDetail={placaDetail}
            placaPiles={placaPiles}
            fichapdaDetail={fichapdaDetail}
            pdaDiarioDetail={pdaDiarioDetail}
            pdaDiarioPiles={pdaDiarioPiles}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 md:mb-8 px-1 sm:px-0 space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            Diários Geoteste
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300">
            Visualize todos os diários de obra da Geoteste
          </p>
        </div>
        
        <button
          onClick={onNewDiary}
          className="w-full sm:w-auto bg-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-green-700 hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Novo Diário</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-4 sm:mb-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end">
            {/* Busca */}
            <div className="relative sm:col-span-2 lg:col-span-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Buscar por cliente, endereço ou serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Data inicial */}
            <div className="sm:col-span-1">
              <label htmlFor="date-start" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                De
              </label>
              <div className="relative">
                <Calendar className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                <input
                  id="date-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-7 sm:pl-9 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Data final */}
            <div className="sm:col-span-1">
              <label htmlFor="date-end" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Até
              </label>
              <div className="relative">
                <Calendar className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                <input
                  id="date-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-7 sm:pl-9 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro de Cliente */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label htmlFor="client-filter" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cliente
              </label>
              <select
                id="client-filter"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Todos os clientes</option>
                {uniqueClients.map((client) => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>

            {/* Filtro de Tipo de Diário */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label htmlFor="type-filter" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Diário
              </label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Todos os tipos</option>
                <option value="PCE">PCE</option>
                <option value="PIT">PIT</option>
                <option value="PLACA">PLACA</option>
                <option value="PDA">Ficha PDA</option>
                <option value="PDA_DIARIO">PDA</option>
              </select>
            </div>

            {/* Ações */}
            <div className="sm:col-span-2 lg:col-span-1 flex flex-col gap-2">
              <button
                onClick={handleExportExcel}
                disabled={filteredDiaries.length === 0 || loading}
                className="w-full px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-1.5"
                title="Exportar para Excel"
              >
                <FileSpreadsheet className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{loading ? 'Exportando...' : 'Exportar Excel'}</span>
              </button>
              <button
                onClick={() => { setSearchTerm(''); setStartDate(''); setEndDate(''); setClientFilter(''); setTypeFilter(''); }}
                className="w-full px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:scale-105 transition-all duration-200"
                title="Limpar filtros"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <DiaryListSkeleton count={6} />
      ) : (
        <>
          {/* Diaries List */}
          <div className="space-y-3 sm:space-y-4">
            {paginatedDiaries.map((diary) => (
          <div key={diary.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-700 hover:scale-[1.02] transition-all duration-200 cursor-pointer">
            <div className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">{diary.clientName}</h3>
                    {diary.type && (
                      <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-medium rounded-full self-start">
                        {diary.type}
                      </span>
                    )}
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full self-start hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors duration-200">
                      Finalizado
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-x-4 sm:gap-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                      {formatDate(diary.date)}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                      {formatTime(diary.startTime)} - {formatTime(diary.endTime)}
                    </span>
                    <span className="flex items-center">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{diary.createdBy}</span>
                    </span>
                  </div>
                  
                  <div className="flex items-start space-x-2 mb-3">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 break-words">{diary.address}</p>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 line-clamp-2 break-words">{diary.servicesExecuted}</p>
                </div>
                
                <div className="flex items-center justify-end sm:justify-start space-x-2 sm:ml-4">
                  <button
                    onClick={() => setSelectedDiary(diary)}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200 hover:scale-110"
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  
                  {user?.role === 'admin' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditDiary(diary);
                        }}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(diary);
                        }}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredDiaries.length === 0 && (
          <EmptyState
            icon={searchTerm || startDate || endDate || clientFilter || typeFilter ? Search : FileText}
            title={searchTerm || startDate || endDate || clientFilter || typeFilter ? 'Nenhum diário encontrado' : 'Nenhum diário cadastrado'}
            description={
              searchTerm || startDate || endDate || clientFilter || typeFilter
                ? 'Tente ajustar os filtros ou termos de busca para encontrar diários.'
                : 'Comece criando seu primeiro diário de obra. É rápido e fácil!'
            }
            actionLabel={!(searchTerm || startDate || endDate || clientFilter || typeFilter) ? 'Criar Primeiro Diário' : undefined}
            onAction={!(searchTerm || startDate || endDate || clientFilter || typeFilter) ? onNewDiary : undefined}
            secondaryActionLabel={searchTerm || startDate || endDate || clientFilter || typeFilter ? 'Limpar Filtros' : undefined}
            onSecondaryAction={searchTerm || startDate || endDate || clientFilter || typeFilter ? () => { setSearchTerm(''); setStartDate(''); setEndDate(''); setClientFilter(''); setTypeFilter(''); } : undefined}
          />
        )}
          </div>

          {/* Paginação */}
          {filteredDiaries.length > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredDiaries.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          )}
        </>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, diary: null })}
        onConfirm={handleDeleteDiary}
        title="Excluir Diário"
        message={`Tem certeza que deseja excluir o diário de "${confirmDialog.diary?.clientName}" do dia ${confirmDialog.diary ? formatDate(confirmDialog.diary.date) : ''}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        isLoading={loading}
      />
    </div>
  );
};