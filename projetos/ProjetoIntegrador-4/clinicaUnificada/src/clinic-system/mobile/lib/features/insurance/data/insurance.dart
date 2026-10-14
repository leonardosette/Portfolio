import 'package:equatable/equatable.dart';

import '../../../core/json.dart';

class Insurance extends Equatable {
  const Insurance({
    required this.id,
    required this.operadora,
    required this.numeroCarteirinha,
    required this.plano,
    required this.codigoAns,
    required this.dataInicio,
    required this.dataValidade,
    required this.titular,
    required this.nomeTitular,
    required this.principal,
    required this.ativo,
    required this.vencido,
  });
  final String id;
  final String operadora;
  final String numeroCarteirinha;
  final String plano;
  final String codigoAns;
  final DateTime? dataInicio;
  final DateTime? dataValidade;
  final bool titular;
  final String nomeTitular;
  final bool principal;
  final bool ativo;
  final bool vencido;
  factory Insurance.fromJson(Json json) => Insurance(
    id: asString(json['id']),
    operadora: asString(json['operadora']),
    numeroCarteirinha: asString(json['numeroCarteirinha']),
    plano: asString(json['plano']),
    codigoAns: asString(json['codigoAns']),
    dataInicio: asDateOrNull(json['dataInicio']),
    dataValidade: asDateOrNull(json['dataValidade']),
    titular: asBool(json['titular']),
    nomeTitular: asString(json['nomeTitular']),
    principal: asBool(json['principal']),
    ativo: asBool(json['ativo']),
    vencido: asBool(json['vencido']),
  );
  @override
  List<Object?> get props => [
    id,
    operadora,
    numeroCarteirinha,
    plano,
    codigoAns,
    dataInicio,
    dataValidade,
    titular,
    nomeTitular,
    principal,
    ativo,
    vencido,
  ];
  @override
  bool get stringify => false;
}
