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
          const src = typeof value === 'string' ? value : (value?.url || '');
          const node = super.create(src);
          if (src) {
            node.setAttribute('src', src);
          }
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
          return node.getAttribute('src') || '';
        }
      }
      ImageBlot.blotName = 'image';
      ImageBlot.tagName = 'img';
      Quill.register(ImageBlot, true);
      
      setQuillEditor(() => RQ);
    };
    loadQuill();
  }, []);

  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor ? quillRef.current.getEditor() : null;
      if (editor && typeof value === 'string') {
        const currentHtml = editor.root.innerHTML;
        if (value !== currentHtml && (value || currentHtml !== '<p><br></p>')) {
          editor.root.innerHTML = value;
        }
      }
    }
  }, [value]);

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading('Görsel Cloudinary\'ye yükleniyor...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'manav-platform/articles');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Yükleme başarısız');

      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection(true);
        const index = range ? range.index : Math.max(0, quill.getLength() - 1);
        quill.insertEmbed(index, 'image', data.url);
        quill.setSelection(index + 1);
      }
      toast.success('Görsel eklendi!', { id: loadingToast });
    } catch (err: any) {
      toast.error('Görsel yüklenemedi: ' + err.message, { id: loadingToast });
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const imageHandler = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      const url = window.prompt("Görselin internet adresini (URL) buraya yapıştırın:");
      if (url && url.trim()) {
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          const index = range ? range.index : Math.max(0, quill.getLength() - 1);
          quill.insertEmbed(index, 'image', url.trim());
          quill.setSelection(index + 1);
        }
      }
    }
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
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
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script', 'list', 'bullet', 'indent', 'align',
    'blockquote', 'code-block',
    'link', 'image', 'video', 'width'
  ];

  if (!QuillEditor) {
    return <div style={{ height: 300, background: '#f8f9fa', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Editör yükleniyor...</div>;
  }

  return (
    <div className="rich-text-editor">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
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
        .ql-image-grow::before { content: 'IMG+'; font-size: 11px; font-weight: bold; }
        .ql-image-shrink::before { content: 'IMG-'; font-size: 11px; font-weight: bold; }
        
        .rich-text-editor .ql-editor {
          min-height: 500px;
          font-size: 1.15rem;
          line-height: 1.9;
          color: #1a202c;
          background: #fff;
          font-family: 'Inter', sans-serif;
          padding: 30px;
        }
        .rich-text-editor .ql-container {
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
          border-color: #e2e8f0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          background: #f8fafc;
          border-color: #e2e8f0;
          padding: 12px;
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
        @media (max-width: 768px) {
          .rich-text-editor .ql-editor {
            min-height: 300px;
            padding: 16px;
            font-size: 1rem;
            line-height: 1.7;
          }
          .rich-text-editor .ql-toolbar {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
