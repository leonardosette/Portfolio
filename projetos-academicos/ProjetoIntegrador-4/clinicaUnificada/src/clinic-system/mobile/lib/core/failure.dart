import '../l10n/strings.dart';

sealed class Failure implements Exception {
  const Failure(this.mensagem);
  final String mensagem;
}

class FalhaDeRede extends Failure {
  const FalhaDeRede([super.mensagem = S.networkError]);
}

class FalhaDeTimeout extends Failure {
  const FalhaDeTimeout([super.mensagem = S.timeout]);
}

class FalhaDeRequisicao extends Failure {
  const FalhaDeRequisicao(super.mensagem);
}

class SessaoExpirada extends Failure {
  const SessaoExpirada([super.mensagem = S.expired]);
}

class AcessoNegado extends Failure {
  const AcessoNegado([super.mensagem = S.accessDenied]);
}

class NaoEncontrado extends Failure {
  const NaoEncontrado([super.mensagem = S.notFound]);
}

class FalhaDoServidor extends Failure {
  const FalhaDoServidor([super.mensagem = S.serverError]);
}

class FalhaDeContrato extends Failure {
  const FalhaDeContrato([super.mensagem = S.contractError]);
}
