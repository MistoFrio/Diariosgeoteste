import React, { useEffect, useState } from 'react';
import { Users, MapPin, Calendar, User as UserIcon, X, Plus, Loader2, Briefcase, RefreshCw } from 'lucide-react';
import { EquipmentLocation, Team, TeamEquipmentAssignment, User } from '../types';
import { useToast } from '../contexts/ToastContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import EmptyState from './EmptyState';

interface TeamsPanelProps {
  equipmentList: EquipmentLocation[];
  onAssignmentChange?: () => void;
}

interface EquipmentWithTeam extends EquipmentLocation {
  teamAssignment?: TeamEquipmentAssignment & {
    team?: Team & {
      collaborators?: User[]; // Agora usando User (profiles) ao invés de Collaborator
    };
  };
}

export const TeamsPanel: React.FC<TeamsPanelProps> = ({ equipmentList, onAssignmentChange }) => {
  const toast = useToast();
  const [equipmentWithTeams, setEquipmentWithTeams] = useState<EquipmentWithTeam[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigningTeamId, setAssigningTeamId] = useState<string | null>(null);

  // Buscar equipes
  const fetchTeams = async () => {
    if (!isSupabaseConfigured) {
      setTeams([
        { id: '1', name: 'Equipe Alfa', description: 'Equipe principal', status: 'ativa', createdAt: new Date().toISOString() },
        { id: '2', name: 'Equipe Beta', description: 'Equipe secundária', status: 'ativa', createdAt: new Date().toISOString() },
      ]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('status', 'ativa')
        .order('name', { ascending: true });

      if (error) throw error;
      setTeams((data || []).map(mapRowToTeam));
    } catch (err: any) {
      console.error('Erro ao carregar equipes:', err);
      toast.error('Erro ao carregar equipes');
    }
  };

  // Buscar associações equipe-equipamento
  const fetchAssignments = async () => {
    if (!isSupabaseConfigured) {
      // Mock data
      const mockAssignments: EquipmentWithTeam[] = equipmentList.map((eq, index) => ({
        ...eq,
        teamAssignment: index === 0 ? {
          id: '1',
          teamId: '1',
          equipmentId: eq.id,
          assignedAt: new Date().toISOString(),
          status: 'ativo',
          createdAt: new Date().toISOString(),
          team: {
            id: '1',
            name: 'Equipe Alfa',
            description: 'Equipe principal',
            status: 'ativa',
            createdAt: new Date().toISOString(),
            collaborators: [
              { id: '1', name: 'João Silva', email: 'joao@example.com', photoUrl: null, collaboratorStatus: 'ativo', role: 'user', createdAt: new Date().toISOString() },
              { id: '2', name: 'Maria Santos', email: 'maria@example.com', photoUrl: null, collaboratorStatus: 'ativo', role: 'user', createdAt: new Date().toISOString() },
            ],
          },
        } : undefined,
      }));
      setEquipmentWithTeams(mockAssignments);
      return;
    }

    setLoading(true);
    try {
      // Buscar todas as associações ativas
      const { data: assignments, error: assignmentsError } = await supabase
        .from('team_equipment_assignments')
        .select(`
          *,
          team:teams(
            *,
            team_collaborators(
              collaborator:profiles(*)
            )
          )
        `)
        .eq('status', 'ativo')
        .order('assigned_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Mapear os resultados
      const assignmentMap = new Map<string, any>();
      (assignments || []).forEach((assignment: any) => {
        const team = assignment.team ? {
          ...mapRowToTeam(assignment.team),
          collaborators: assignment.team.team_collaborators?.map((tc: any) => 
            mapRowToUser(tc.collaborator)
          ).filter(Boolean) || [],
        } : undefined;

        assignmentMap.set(assignment.equipment_id, {
          ...mapRowToAssignment(assignment),
          team,
        });
      });

      // Combinar equipamentos com suas equipes
      const equipmentWithTeamsData: EquipmentWithTeam[] = equipmentList.map(equipment => ({
        ...equipment,
        teamAssignment: assignmentMap.get(equipment.id),
      }));

      setEquipmentWithTeams(equipmentWithTeamsData);
    } catch (err: any) {
      console.error('Erro ao carregar associações:', err);
      toast.error('Erro ao carregar equipes dos equipamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchAssignments();
  }, [equipmentList]);

  const mapRowToTeam = (row: any): Team => ({
    id: row.id,
    name: row.name || '',
    description: row.description || null,
    status: row.status || 'ativa',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt,
  });

  const mapRowToUser = (row: any): User | null => {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name || '',
      email: row.email || '',
      role: row.role || 'user',
      createdAt: row.created_at || row.createdAt || new Date().toISOString(),
      photoUrl: row.photo_url || null,
      phone: row.phone || null,
      collaboratorRole: row.collaborator_role || null,
      collaboratorStatus: row.collaborator_status || null,
      updatedAt: row.updated_at || row.updatedAt,
    };
  };

  const mapRowToAssignment = (row: any): TeamEquipmentAssignment => ({
    id: row.id,
    teamId: row.team_id,
    equipmentId: row.equipment_id,
    assignedAt: row.assigned_at || row.assignedAt || new Date().toISOString(),
    assignedUntil: row.assigned_until || row.assignedUntil || null,
    status: row.status || 'ativo',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt,
  });

  const handleAssignTeam = async (equipmentId: string, teamId: string) => {
    if (!isSupabaseConfigured) {
      toast.success('Equipe associada (modo demonstração)');
      fetchAssignments();
      onAssignmentChange?.();
      return;
    }

    setAssigningTeamId(`${equipmentId}-${teamId}`);
    try {
      // Finalizar qualquer associação ativa anterior para este equipamento
      await supabase
        .from('team_equipment_assignments')
        .update({ status: 'finalizado', assigned_until: new Date().toISOString() })
        .eq('equipment_id', equipmentId)
        .eq('status', 'ativo');

      // Criar nova associação
      const { error } = await supabase
        .from('team_equipment_assignments')
        .insert({
          team_id: teamId,
          equipment_id: equipmentId,
          status: 'ativo',
        });

      if (error) throw error;

      toast.success('Equipe associada ao equipamento!');
      fetchAssignments();
      onAssignmentChange?.();
    } catch (err: any) {
      console.error('Erro ao associar equipe:', err);
      toast.error('Erro ao associar equipe ao equipamento');
    } finally {
      setAssigningTeamId(null);
    }
  };

  const handleUnassignTeam = async (assignmentId: string, equipmentId: string) => {
    if (!isSupabaseConfigured) {
      toast.success('Equipe desassociada (modo demonstração)');
      fetchAssignments();
      onAssignmentChange?.();
      return;
    }

    try {
      const { error } = await supabase
        .from('team_equipment_assignments')
        .update({
          status: 'finalizado',
          assigned_until: new Date().toISOString(),
        })
        .eq('id', assignmentId);

      if (error) throw error;

      toast.success('Equipe desassociada do equipamento!');
      fetchAssignments();
      onAssignmentChange?.();
    } catch (err: any) {
      console.error('Erro ao desassociar equipe:', err);
      toast.error('Erro ao desassociar equipe do equipamento');
    }
  };

  if (loading && equipmentWithTeams.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (equipmentList.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="Nenhum equipamento cadastrado"
        description="Cadastre equipamentos para começar a associar equipes."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Equipes nos Equipamentos</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Visualize e gerencie quais equipes estão trabalhando em cada equipamento
          </p>
        </div>
        <button
          onClick={fetchAssignments}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:border-green-200 hover:text-green-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {equipmentWithTeams.map((equipment) => {
          const teamAssignment = equipment.teamAssignment;
          const team = teamAssignment?.team;

          return (
            <div
              key={equipment.id}
              className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {equipment.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {equipment.address}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    equipment.status === 'ativo'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200'
                      : equipment.status === 'em manutenção'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {equipment.status}
                </span>
              </div>

              {team ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-gray-900 dark:text-white">{team.name}</span>
                    </div>
                    <button
                      onClick={() => handleUnassignTeam(teamAssignment!.id, equipment.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remover equipe"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {team.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{team.description}</p>
                  )}

                  {teamAssignment && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Desde {new Date(teamAssignment.assignedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}

                  {team.collaborators && team.collaborators.length > 0 && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Colaboradores ({team.collaborators.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {team.collaborators.map((collaborator) => (
                          <div
                            key={collaborator.id}
                            className="flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            {collaborator.photoUrl ? (
                              <img
                                src={collaborator.photoUrl}
                                alt={collaborator.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <UserIcon className="w-3 h-3 text-green-600 dark:text-green-400" />
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {collaborator.name}
                              </span>
                              {collaborator.collaboratorRole && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {collaborator.collaboratorRole}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Nenhuma equipe associada</span>
                  </div>

                  {teams.length > 0 ? (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Associar equipe:
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignTeam(equipment.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        disabled={loading}
                        className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-950 focus:border-green-500 focus:outline-none"
                      >
                        <option value="">Selecione uma equipe...</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Nenhuma equipe disponível. Crie equipes para associá-las aos equipamentos.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

