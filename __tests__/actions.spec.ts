import CodeMirror from 'codemirror';
import type { Editor } from 'codemirror';
import { getDocumentAndSelection } from './test-helpers';
import {
  insertLineAbove,
  insertLineBelow,
  deleteSelectedLines,
  joinLines,
  duplicateLine,
  selectWord,
  selectLine,
  goToLineBoundary,
  transformCase,
  expandSelectionToBrackets,
  expandSelectionToQuotes,
} from '../actions';
import { CASE } from '../constants';

// fixes jsdom type error - https://github.com/jsdom/jsdom/issues/3002#issuecomment-655748833
document.createRange = () => {
  const range = new Range();

  range.getBoundingClientRect = jest.fn();

  range.getClientRects = jest.fn(() => ({
    item: () => null,
    length: 0,
  }));

  return range;
};

describe('Code Editor Shortcuts: actions', () => {
  let editor: Editor;
  const originalDoc = 'lorem ipsum\ndolor sit\namet';

  beforeAll(() => {
    editor = CodeMirror(document.body);
  });

  describe('single cursor selection', () => {
    beforeEach(() => {
      editor.setValue(originalDoc);
      editor.setCursor({ line: 1, ch: 0 });
    });

    it('should insert line above', () => {
      insertLineAbove(editor as any);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\n\ndolor sit\namet');
      expect(cursor.line).toEqual(1);
    });

    it('should insert line above first line', () => {
      editor.setCursor({ line: 0, ch: 0 });

      insertLineAbove(editor as any);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('\nlorem ipsum\ndolor sit\namet');
      expect(cursor.line).toEqual(0);
    });

    it('should insert line below', () => {
      insertLineBelow(editor as any);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit\n\namet');
      expect(cursor.line).toEqual(2);
    });

    it('should insert line below with the same indentation level', () => {
      editor.setValue('    lorem ipsum\n    dolor sit\n    amet');
      editor.setCursor({ line: 1, ch: 0 });

      insertLineBelow(editor as any);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('    lorem ipsum\n    dolor sit\n    \n    amet');
      expect(cursor.line).toEqual(2);
      expect(cursor.ch).toEqual(4);
    });

    it('should insert line below last line', () => {
      editor.setCursor({ line: 2, ch: 0 });

      insertLineBelow(editor as any);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit\namet\n');
      expect(cursor.line).toEqual(3);
    });

    it('should delete line at cursor', () => {
      deleteSelectedLines(editor as any);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\namet');
      expect(cursor.line).toEqual(1);
    });

    it('should delete last line', () => {
      editor.setCursor({ line: 2, ch: 0 });

      deleteSelectedLines(editor as any);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit');
      expect(cursor.line).toEqual(1);
    });

    it('should join next line to current line', () => {
      joinLines(editor as any);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit amet');
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(9);
    });

    it('should duplicate current line', () => {
      duplicateLine(editor as any);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit\ndolor sit\namet');
      expect(cursor.line).toEqual(2);
    });

    it('should select word', () => {
      selectWord(editor as any);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selectedText).toEqual('dolor');
    });

    it('should select line', () => {
      selectLine(editor as any);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selectedText).toEqual('dolor sit\n');
    });

    it('should go to line start', () => {
      goToLineBoundary(editor as any, 'start');

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(0);
    });

    it('should go to line end', () => {
      goToLineBoundary(editor as any, 'end');

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(9);
    });

    it('should transform to uppercase', () => {
      transformCase(editor as any, CASE.UPPER);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\nDOLOR sit\namet');
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(0);
    });

    it('should transform to lowercase', () => {
      editor.setValue('lorem ipsum\nDOLOR sit\namet');
      editor.setCursor({ line: 1, ch: 0 });

      transformCase(editor as any, CASE.LOWER);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(0);
    });

    it('should transform to title case', () => {
      transformCase(editor as any, CASE.TITLE);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\nDolor sit\namet');
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(0);
    });

    it.each([
      ['()', '(lorem ipsum) dolor'],
      ['[]', 'dolor [lorem ipsum]'],
      ['{}', 'dolor {lorem ipsum} sit amet'],
    ])(
      'should expand selection to %s brackets if cursor is inside',
      (_scenario, content) => {
        editor.setValue(content);
        editor.setCursor({ line: 0, ch: 8 });

        expandSelectionToBrackets(editor as any);

        const { doc, selectedText } = getDocumentAndSelection(editor);
        expect(doc).toEqual(content);
        expect(selectedText).toEqual('lorem ipsum');
      },
    );

    it('should not expand selection to brackets if cursor is outside', () => {
      const content = '(lorem ipsum) dolor';
      editor.setValue(content);
      editor.setCursor({ line: 0, ch: 15 });

      expandSelectionToBrackets(editor as any);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(content);
      expect(selectedText).toEqual('');
    });

    it('should not expand selection to mismatched brackets', () => {
      const content = '(lorem ipsum] dolor';
      editor.setValue(content);
      editor.setCursor({ line: 0, ch: 6 });

      expandSelectionToBrackets(editor as any);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(content);
      expect(selectedText).toEqual('');
    });

    it.each([
      ['single', "'lorem ipsum' dolor"],
      ['double', 'dolor "lorem ipsum"'],
    ])(
      'should expand selection to %s quotes if cursor is inside',
      (_scenario, content) => {
        editor.setValue(content);
        editor.setCursor({ line: 0, ch: 8 });

        expandSelectionToQuotes(editor as any);

        const { doc, selectedText } = getDocumentAndSelection(editor);
        expect(doc).toEqual(content);
        expect(selectedText).toEqual('lorem ipsum');
      },
    );

    it('should not expand selection to quotes if cursor is outside', () => {
      const content = '"lorem ipsum" dolor';
      editor.setValue(content);
      editor.setCursor({ line: 0, ch: 15 });

      expandSelectionToQuotes(editor as any);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(content);
      expect(selectedText).toEqual('');
    });

    it('should not expand selection to mismatched quotes', () => {
      const content = '\'lorem ipsum" dolor';
      editor.setValue(content);
      editor.setCursor({ line: 0, ch: 6 });

      expandSelectionToQuotes(editor as any);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(content);
      expect(selectedText).toEqual('');
    });
  });

  describe('single range selection', () => {
    beforeEach(() => {
      editor.setValue(originalDoc);
      editor.setSelection({ line: 0, ch: 6 }, { line: 1, ch: 5 });
    });

    it('should insert line above', () => {
      insertLineAbove(editor as any);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\n\ndolor sit\namet');
      expect(cursor.line).toEqual(1);
    });

    it('should insert line below', () => {
      insertLineBelow(editor as any);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit\n\namet');
      expect(cursor.line).toEqual(2);
    });

    it('should delete selected lines', () => {
      deleteSelectedLines(editor as any);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('amet');
      expect(cursor.line).toEqual(0);
    });

    it('should join next line to current line', () => {
      joinLines(editor as any);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit amet');
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(9);
    });

    it('should duplicate selected lines', () => {
      duplicateLine(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(
        'lorem ipsum\ndolor sit\nlorem ipsum\ndolor sit\namet',
      );
      expect(selections[0].anchor).toEqual(
        expect.objectContaining({ line: 2, ch: 6 }),
      );
      expect(selections[0].head).toEqual(
        expect.objectContaining({ line: 3, ch: 5 }),
      );
    });

    it('should not select additional words', () => {
      selectWord(editor as any);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selectedText).toEqual('ipsum\ndolor');
    });

    it('should select lines', () => {
      selectLine(editor as any);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selectedText).toEqual('lorem ipsum\ndolor sit\n');
    });

    it('should go to line start', () => {
      goToLineBoundary(editor as any, 'start');

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(0);
      expect(cursor.ch).toEqual(0);
    });

    it('should go to line end', () => {
      goToLineBoundary(editor as any, 'end');

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(9);
    });

    it('should transform to uppercase', () => {
      transformCase(editor as any, CASE.UPPER);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem IPSUM\nDOLOR sit\namet');
      expect(selectedText).toEqual('IPSUM\nDOLOR');
    });

    it('should transform to lowercase', () => {
      editor.setValue('lorem ipsum\nDOLOR sit\namet');
      editor.setSelection({ line: 0, ch: 6 }, { line: 1, ch: 5 });

      transformCase(editor as any, CASE.LOWER);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit\namet');
      expect(selectedText).toEqual('ipsum\ndolor');
    });

    it('should transform to title case', () => {
      transformCase(editor as any, CASE.TITLE);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem Ipsum\nDolor sit\namet');
      expect(selectedText).toEqual('Ipsum\nDolor');
    });

    it("should not transform 'the', 'a' or 'an' to title case if not the first word", () => {
      editor.setValue(
        'AN EXAMPLE TO TEST THE OBSIDIAN PLUGIN AND A CASE CONVERSION FEATURE',
      );
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 68 });

      transformCase(editor as any, CASE.TITLE);

      const { doc } = getDocumentAndSelection(editor);
      expect(doc).toEqual(
        'An Example To Test the Obsidian Plugin And a Case Conversion Feature',
      );
    });

    it.each([
      ['()', 'lorem (ipsum\ndolor sit\nam)et'],
      ['[]', 'lorem [ipsum\ndolor sit\nam]et'],
      ['{}', 'lorem {ipsum\ndolor sit\nam}et'],
    ])(
      'should expand selection to %s brackets if entire selection is inside',
      (_scenario, content) => {
        editor.setValue(content);
        editor.setSelection({ line: 0, ch: 10 }, { line: 1, ch: 5 });

        expandSelectionToBrackets(editor as any);

        const { doc, selectedText } = getDocumentAndSelection(editor);
        expect(doc).toEqual(content);
        expect(selectedText).toEqual('ipsum\ndolor sit\nam');
      },
    );

    it('should not expand selection to brackets if part of selection is outside', () => {
      const content = '(lorem ipsum)\ndolor';
      editor.setValue(content);
      editor.setSelection({ line: 0, ch: 10 }, { line: 1, ch: 2 });

      expandSelectionToBrackets(editor as any);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(content);
      expect(selectedText).toEqual('um)\ndo');
    });

    it.each([
      ['single', "lorem 'ipsum\ndolor'"],
      ['double', 'lorem "ipsum\ndolor"'],
    ])(
      'should expand selection to %s quotes if entire selection is inside',
      (_scenario, content) => {
        editor.setValue(content);
        editor.setSelection({ line: 0, ch: 10 }, { line: 1, ch: 2 });

        expandSelectionToQuotes(editor as any);

        const { doc, selectedText } = getDocumentAndSelection(editor);
        expect(doc).toEqual(content);
        expect(selectedText).toEqual('ipsum\ndolor');
      },
    );

    it('should not expand selection to quotes if part of selection is outside', () => {
      const content = '"lorem ipsum"\ndolor';
      editor.setValue(content);
      editor.setSelection({ line: 0, ch: 10 }, { line: 1, ch: 2 });

      expandSelectionToQuotes(editor as any);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(content);
      expect(selectedText).toEqual('um"\ndo');
    });
  });
});
