import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/formatters.dart';
import '../../../l10n/strings.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/form_helpers.dart';
import '../../../shared/widgets/offline_banner.dart';
import '../data/insurance.dart';
import '../data/insurance_repository.dart';
import 'insurance_provider.dart';

class InsurancePage extends ConsumerStatefulWidget {
  const InsurancePage({super.key});
  @override
  ConsumerState<InsurancePage> createState() => _InsurancePageState();
}

class _InsurancePageState extends ConsumerState<InsurancePage> {
  bool busy = false;
  Future<void> mutate(Insurance item, {bool remove = false}) async {
    if (remove && !await confirmAction(context, S.removeInsurance, S.remove)) {
      return;
    }
    if (!mounted) return;
    setState(() => busy = true);
    try {
      final repo = ref.read(insuranceRepositoryProvider);
      if (remove) {
        await repo.remove(item.id);
      } else {
        await repo.principal(item.id);
      }
      ref.invalidate(insuranceProvider);
    } catch (e) {
      if (mounted) showFailure(context, e);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text(S.insurance)),
    floatingActionButton: FloatingActionButton.extended(
      onPressed: busy ? null : () => context.push('/perfil/convenios/form'),
      icon: const Icon(Icons.add),
      label: const Text(S.newInsurance),
    ),
    body: OnlineBody(
      child: RefreshIndicator(
        onRefresh: () async {
          await ref.refresh(insuranceProvider.future).then((_) {});
        },
        child: AsyncValueView<List<Insurance>>(
          value: ref.watch(insuranceProvider),
          onRetry: () => ref.invalidate(insuranceProvider),
          isEmpty: (items) => items.isEmpty,
          emptyBuilder: (context) => const EmptyState(
            message: S.noInsurance,
            hint: S.addInsuranceHint,
          ),
          onData: (items) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
            children: [
              if (!items.any((item) => item.principal))
                const Padding(
                  padding: EdgeInsets.all(12),
                  child: Text(S.noPrincipal),
                ),
              for (final item in items)
                Card(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(
                      color: item.principal
                          ? const Color(0xFF0F6848)
                          : Colors.transparent,
                      width: 2,
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.operadora,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        Wrap(
                          spacing: 8,
                          children: [
                            if (item.principal)
                              const Chip(label: Text(S.principal)),
                            if (item.vencido)
                              const Chip(label: Text(S.expiredInsurance)),
                          ],
                        ),
                        Text(S.card(item.numeroCarteirinha)),
                        if (item.plano.isNotEmpty) Text(item.plano),
                        if (!item.titular && item.nomeTitular.isNotEmpty)
                          Text(S.holderValue(item.nomeTitular)),
                        if (item.dataValidade != null)
                          Text(S.validUntil(dateLabel(item.dataValidade))),
                        if (item.codigoAns.isNotEmpty)
                          Text(S.ansValue(item.codigoAns)),
                        Wrap(
                          spacing: 8,
                          children: [
                            if (!item.principal)
                              TextButton(
                                onPressed: busy ? null : () => mutate(item),
                                child: const Text(S.principal),
                              ),
                            TextButton(
                              onPressed: busy
                                  ? null
                                  : () => context.push(
                                      '/perfil/convenios/form?id=${Uri.encodeComponent(item.id)}',
                                    ),
                              child: const Text(S.edit),
                            ),
                            Semantics(
                              label: S.removeInsurance,
                              button: true,
                              excludeSemantics: true,
                              child: TextButton(
                                onPressed: busy
                                    ? null
                                    : () => mutate(item, remove: true),
                                child: const Text(S.remove),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    ),
  );
}
