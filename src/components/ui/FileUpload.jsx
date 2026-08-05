import React, { useId, useState } from 'react';
import { Upload } from 'lucide-react';

export default function FileUpload({ label, onChange, pageCount = 0, accept = 'image/*', multiple = true }) {
  const id = useId();
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files) => {
    if (files?.length && onChange) {
      const syntheticEvent = { target: { files } };
      onChange(syntheticEvent);
    }
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold mb-2"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
      >
        {label}
      </label>
      <div
        className={`relative rounded-[var(--radius-md)] ui-upload-zone ${dragOver ? 'ui-upload-zone--drag' : ''}`}
        style={{ padding: '1.5rem' }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <label
          htmlFor={id}
          className="ui-upload-label flex flex-col items-center justify-center gap-2 cursor-pointer rounded-[var(--radius-sm)] py-4"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Upload size={32} style={{ color: 'var(--crayon-blue)' }} aria-hidden="true" />
          <span className="font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Drop your drawing here
          </span>
          <span className="text-sm">or click to choose files</span>
          <input
            id={id}
            type="file"
            multiple={multiple}
            accept={accept}
            onChange={onChange}
            className="sr-only"
          />
        </label>
      </div>
      <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
        {pageCount} page{pageCount === 1 ? '' : 's'} uploaded
      </p>
    </div>
  );
}
