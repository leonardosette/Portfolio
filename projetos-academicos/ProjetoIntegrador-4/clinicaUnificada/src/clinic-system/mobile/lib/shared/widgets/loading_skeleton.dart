import 'package:flutter/material.dart';

import '../../l10n/strings.dart';

class LoadingSkeleton extends StatelessWidget {
  const LoadingSkeleton({super.key});
  @override
  Widget build(BuildContext context) => Semantics(
    label: S.loading,
    child: ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: 4,
      itemBuilder: (context, index) => Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(height: 20, width: 160, color: Colors.grey.shade200),
              const SizedBox(height: 16),
              Container(height: 14, color: Colors.grey.shade200),
              const SizedBox(height: 12),
              Container(height: 14, width: 100, color: Colors.grey.shade200),
            ],
          ),
        ),
      ),
    ),
  );
}
