import React from 'react'
import PropTypes from 'prop-types'
import { X, UploadCloud } from 'lucide-react'

export default function UploadZone({ label, file, onClear, onChange }) {
  const fileSrc = file && typeof file === 'string' ? file : file ? URL.createObjectURL(file) : null

  const handleChange = (e) => {
    const f = e.target.files && e.target.files[0]
    if (f && onChange) onChange(f)
  }

  return (
    <div className="relative group">
      <div className={`relative h-64 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center bg-white/2 p-6 ${file ? 'border-violet-600/50 bg-violet-500/5' : 'border-white/10 hover:border-violet-500/30 hover:bg-white/5'}`}>
        {file ? (
          <>
            <img src={fileSrc} alt="preview" className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-60" />

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl backdrop-blur-sm">
              <button type="button" onClick={onClear} className="p-2 rounded-full bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="absolute bottom-4 left-4 bg-black/40 p-3 rounded-lg border border-white/10 backdrop-blur-md">
              <p className="text-sm font-medium truncate">{file && typeof file === 'object' ? file.name : 'Preview'}</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-violet-400 transition-colors" />
            </div>

            <h3 className="text-white font-medium">{label}</h3>
            <p className="text-sm text-slate-400">Drag & drop or click to upload</p>

            <input type="file" accept="image/*" onChange={handleChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </>
        )}
      </div>
    </div>
  )
}

UploadZone.propTypes = {
  label: PropTypes.string,
  file: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onClear: PropTypes.func,
  onChange: PropTypes.func,
}

UploadZone.defaultProps = {
  label: 'Upload Image',
  file: null,
  onClear: () => {},
  onChange: () => {},
}
