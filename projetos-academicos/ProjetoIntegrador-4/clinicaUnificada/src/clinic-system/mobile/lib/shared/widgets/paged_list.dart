import 'package:flutter/material.dart';

import '../../l10n/strings.dart';

class PagedList<T> extends StatefulWidget {
  const PagedList({super.key, required this.items, required this.itemBuilder});
  final List<T> items;
  final Widget Function(T) itemBuilder;
  @override
  State<PagedList<T>> createState() => _PagedListState<T>();
}

class _PagedListState<T> extends State<PagedList<T>> {
  int visible = 20;
  @override
  void didUpdateWidget(covariant PagedList<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.items != widget.items) visible = 20;
  }

  @override
  Widget build(BuildContext context) {
    final count = visible.clamp(0, widget.items.length);
    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: count + (count < widget.items.length ? 1 : 0),
      itemBuilder: (context, index) => index == count
          ? TextButton(
              onPressed: () => setState(() => visible += 20),
              child: const Text(S.more),
            )
          : widget.itemBuilder(widget.items[index]),
    );
  }
}
