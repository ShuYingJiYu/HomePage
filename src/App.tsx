import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container-custom py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            书樱寄语网络工作室
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Shuying Studio - 专业的网络开发工作室
          </p>
          <div className="card max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-4">项目初始化完成</h2>
            <p className="text-gray-600 mb-6">
              React + TypeScript + Vite + Tailwind CSS 基础架构已搭建完成
            </p>
            <button className="btn-primary w-full">
              开始开发
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App