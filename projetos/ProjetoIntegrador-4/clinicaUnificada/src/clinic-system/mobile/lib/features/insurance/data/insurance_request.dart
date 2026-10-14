import '../../../core/json.dart';
import '../../../core/formatters.dart';

class InsuranceRequest {
  const InsuranceRequest({
    required this.operadora,
    required this.numeroCarteirinha,
    required this.plano,
    required this.codigoAns,
    required this.dataInicio,
    required this.dataValidade,
    required this.titular,
    required this.nomeTitular,
    required this.principal,
  });
  final String operadora, numeroCarteirinha, plano, codigoAns, nomeTitular;
  final DateTime? dataInicio, dataValidade;
  final bool titular, principal;
  Json toJson() => {
    'operadora': operadora.trim(),
    'numeroCarteirinha': numeroCarteirinha.trim(),
    'plano': plano.trim(),
    'codigoAns': codigoAns.trim(),
    'dataInicio': dataInicio == null ? null : dateWire(dataInicio!),
    'dataValidade': dataValidade == null ? null : dateWire(dataValidade!),
    'titular': titular,
    'nomeTitular': nomeTitular.trim(),
    'principal': principal,
  };
}
