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

      console.log('Image upload process started for:', file.name);
      const toastId = toast.loading('Görsel hazırlanıyor...');
      
      try {
        const { uploadBytesResumable, getDownloadURL, ref: storageRefFunc } = await import('firebase/storage');
        const fileRef = storageRefFunc(storage, `editor-images/${Date.now()}-${file.name}`);
        
        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            toast.loading(`Görsel yükleniyor: %${Math.round(progress)}`, { id: toastId });
          }, 
          (error) => {
            console.error('Upload task error:', error);
            toast.error(`Yükleme hatası: ${error.message}`, { id: toastId });
          }, 
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Upload complete. URL:', url);

            const quill = quillRef.current?.getEditor();
            if (quill) {
              const range = quill.getSelection();
              const index = range ? range.index : quill.getLength();
              quill.insertEmbed(index, 'image', url);
              quill.setSelection(index + 1);
              toast.success('Görsel başarıyla eklendi', { id: toastId });
            } else {
              console.error('Could not find Quill editor instance');
              toast.error('Editör bağlantı hatası. Görsel yüklendi ama eklenemedi.', { id: toastId });
            }
          }
        );
      } catch (error: any) {
        console.error('Setup error:', error);
        toast.error(`Hata: ${error.message || 'Başlatılamadı'}`, { id: toastId });
      }
    };
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
  }), [QuillEditor]); // Re-calculate modules when QuillEditor is loaded

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
