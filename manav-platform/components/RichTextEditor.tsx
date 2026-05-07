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
      
      // Extend Image blot to support width attribute
      const Image = Quill.import('formats/image') as any;
      class ImageBlot extends Image {
        static create(value: any) {
          const node = super.create(typeof value === 'string' ? value : value.url);
          if (value.width) {
            node.setAttribute('width', value.width);
            node.style.width = value.width;
          }
          return node;
        }
        static value(node: any) {
          return {
            url: node.getAttribute('src'),
            width: node.getAttribute('width')
          };
        }
      }
      Quill.register(ImageBlot, true);
      
      setQuillEditor(() => RQ);
    };
    loadQuill();
  }, []);

  const imageHandler = () => {
    const url = window.prompt("Görselin internet adresini (URL) buraya yapıştırın:");
    
    if (url && url.trim()) {
      const width = window.prompt("Görsel genişliğini ayarlayın (Örn: 50%, 300px, 100%):\n(Boş bırakırsanız orijinal boyutta kalır)", "100%");
      
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();
        // Insert with custom blot that accepts width
        quill.insertEmbed(index, 'image', { 
          url: url.trim(), 
          width: width || '100%' 
        });
        quill.setSelection(index + 1);
        toast.success('Görsel eklendi');
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
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), [QuillEditor]);

  const formats = [
    'header', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'link', 'image'
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
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
