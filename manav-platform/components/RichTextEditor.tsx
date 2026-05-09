'use client';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import 'react-quill-new/dist/quill.snow.css';
import toast from 'react-hot-toast';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const [QuillEditor, setQuillEditor] = useState<any>(null);
  const quillRef = useRef<any>(null);

  // Load Quill only on the client side
  useEffect(() => {
    const loadQuill = async () => {
      const { default: RQ, Quill } = await import('react-quill-new');
      
      // Extend Image blot to support width attribute and formatting
      const Image = Quill.import('formats/image') as any;
      class ImageBlot extends Image {
        static create(value: any) {
          const node = super.create(typeof value === 'string' ? value : value.url);
          const width = typeof value === 'object' ? value.width : null;
          if (width) {
            node.setAttribute('width', width);
            node.style.width = width;
          }
          return node;
        }
        static formats(node: any) {
          return node.getAttribute('width');
        }
        format(name: string, value: any) {
          if (name === 'width') {
            this.domNode.setAttribute('width', value);
            this.domNode.style.width = value;
          } else {
            super.format(name, value);
          }
        }
        static value(node: any) {
          return {
            url: node.getAttribute('src'),
            width: node.getAttribute('width')
          };
        }
      }
      ImageBlot.blotName = 'image';
      ImageBlot.tagName = 'img';
      Quill.register(ImageBlot, true);
      
      setQuillEditor(() => RQ);
    };
    loadQuill();
  }, []);

  const resizeSelectedImage = (delta: number) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const range = quill.getSelection();
    if (!range) return toast.error('Önce bir görsele tıklayın');

    const [leaf] = quill.getLeaf(range.index);
    if (leaf && leaf.domNode.tagName === 'IMG') {
      const img = leaf.domNode as HTMLImageElement;
      let currentWidthAttr = img.getAttribute('width') || '100%';
      let currentWidth = parseInt(currentWidthAttr);
      
      let newWidth = currentWidth + delta;
      if (newWidth < 10) newWidth = 10;
      if (newWidth > 100) newWidth = 100;
      
      const widthStr = `${newWidth}%`;
      
      // Apply format to the index of the image
      const index = quill.getIndex(leaf);
      quill.formatText(index, 1, 'width', widthStr);
    } else {
      toast.error('Önce bir görsele tıklayıp imleci yanına getirin');
    }
  };

  const imageHandler = () => {
    const url = window.prompt("Görselin internet adresini (URL) buraya yapıştırın:");
    if (url && url.trim()) {
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();
        quill.insertEmbed(index, 'image', { url: url.trim(), width: '100%' });
        quill.setSelection(index + 1);
      }
    }
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['image-grow', 'image-shrink'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
        'image-grow': () => resizeSelectedImage(5),
        'image-shrink': () => resizeSelectedImage(-5)
      }
    }
  }), [QuillEditor]);

  const formats = [
    'header', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'link', 'image', 'width'
  ];

  if (!QuillEditor) {
    return <div style={{ height: 300, background: '#f8f9fa', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Editör yükleniyor...</div>;
  }

  return (
    <div className="rich-text-editor">
      <QuillEditor
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <style>{`
        .rich-text-editor {
          margin-bottom: 1rem;
        }
        .ql-image-grow::before { content: '🖼️+'; font-size: 11px; font-weight: bold; }
        .ql-image-shrink::before { content: '🖼️-'; font-size: 11px; font-weight: bold; }
        
        .rich-text-editor .ql-editor {
          min-height: 400px;
          font-size: 1.1rem;
          line-height: 1.8;
          color: #333;
          background: #fff;
        }
        .rich-text-editor .ql-container {
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 4px;
          font-family: inherit;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
          background: #f8f9fa;
          border-color: #ddd;
        }
        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 20px 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          cursor: pointer;
        }
        .rich-text-editor .ql-editor img:hover {
          outline: 2px solid var(--gold);
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
