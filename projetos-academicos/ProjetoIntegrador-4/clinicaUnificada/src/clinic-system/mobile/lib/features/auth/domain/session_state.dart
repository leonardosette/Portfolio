class SessionState {
  const SessionState({
    this.ready = false,
    this.authenticated = false,
    this.generation = 0,
    this.name = '',
    this.email = '',
    this.message,
  });
  final bool ready, authenticated;
  final int generation;
  final String name, email;
  final String? message;
}
