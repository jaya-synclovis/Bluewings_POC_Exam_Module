import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentConfig, TreeGroupNode, TreeLeafNode, TreeNode } from '../../models/report-card.models';

// Recursive editor for one node of a weightedTree total formula. A node
// mutates itself in place (it's the same object the parent AssessmentStructure
// component holds), and emits `dirty` (no payload — just "something changed")
// so an arbitrarily deep tree can bubble a single "enable Save" signal up to
// the root without threading data back down.
@Component({
  selector: 'app-tree-node-editor',
  standalone: true,
  // Recursive component: it renders itself for each child, so it must
  // import itself.
  imports: [CommonModule, FormsModule, TreeNodeEditor],
  templateUrl: './tree-node-editor.html',
  styleUrl: './tree-node-editor.css',
})
export class TreeNodeEditor {
  @Input({ required: true }) node!: TreeNode;
  @Input() isRoot = false;
  @Input() availableComponents: ComponentConfig[] = [];
  @Output() removed = new EventEmitter<void>();
  @Output() dirty = new EventEmitter<void>();

  get isGroup(): boolean {
    return 'children' in this.node;
  }

  get groupNode(): TreeGroupNode {
    return this.node as TreeGroupNode;
  }

  get leafNode(): TreeLeafNode {
    return this.node as TreeLeafNode;
  }

  get weightPercent(): number {
    return Math.round(this.node.weight * 1000) / 10;
  }

  get childrenWeightSum(): number {
    if (!this.isGroup) return 0;
    return this.groupNode.children.reduce((sum, child) => sum + child.weight, 0);
  }

  get childrenWeightSumOk(): boolean {
    return Math.abs(this.childrenWeightSum - 1) < 0.005;
  }

  onWeightChange(percent: number): void {
    this.node.weight = (Number(percent) || 0) / 100;
    this.dirty.emit();
  }

  onLabelChange(label: string): void {
    this.node.label = label;
    this.dirty.emit();
  }

  isKeySelected(key: string): boolean {
    return this.leafNode.keys?.includes(key) ?? false;
  }

  toggleKey(key: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const keys = new Set(this.leafNode.keys ?? []);
    if (checked) keys.add(key);
    else keys.delete(key);
    this.leafNode.keys = [...keys];
    this.dirty.emit();
  }

  addExam(): void {
    this.groupNode.children.push({ label: 'New Exam', weight: 0, keys: [] });
    this.dirty.emit();
  }

  addGroup(): void {
    this.groupNode.children.push({ label: 'New Group', weight: 0, children: [] });
    this.dirty.emit();
  }

  removeChildAt(index: number): void {
    this.groupNode.children.splice(index, 1);
    this.dirty.emit();
  }

  distributeEvenly(): void {
    const children = this.groupNode.children;
    if (!children.length) return;
    const even = 1 / children.length;
    children.forEach((child) => (child.weight = Math.round(even * 1000) / 1000));
    this.dirty.emit();
  }
}
