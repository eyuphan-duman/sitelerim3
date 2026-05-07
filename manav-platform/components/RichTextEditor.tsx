'use client';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import 'react-quill-new/dist/quill.snow.css';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
      const { default: RQ } = await import('react-quill-new');
      setQuillEditor(() => RQ);
    };
    loadQuill();
  }, []);

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      console.log('Image upload started:', file.name);
      const toastId = toast.loading('Görsel yükleniyor...');
      try {
        const storageRef = ref(storage, `editor-images/${Date.now()}-${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        console.log('Image uploaded to Firebase:', url);

        // Get the actual quill instance from the ref
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection();
          const index = range ? range.index : 0;
          quill.insertEmbed(index, 'image', url);
          quill.setSelection(index + 1);
          toast.success('Görsel eklendi', { id: toastId });
        } else {
          console.error('Quill instance not found in ref');
          toast.error('Editör bağlantısı kurulamadı. Lütfen sayfayı yenileyin.', { id: toastId });
        }
      } catch (error: any) {
        console.error('Image upload failed:', error);
        toast.error('Görsel yüklenemedi: ' + (error.message || 'Hata oluştu'), { id: toastId });
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
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
  }), [QuillEditor]); // Re-calculate modules when QuillEditor is loaded

  const formats = [
    'header',
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
          min-height: 300px;
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
          border-radius: 8px;
          margin: 10px 0;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
