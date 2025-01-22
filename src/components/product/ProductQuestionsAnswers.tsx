import React from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface QuestionAnswer {
  id: string
  question: string
  answer: string
  order: number
}

interface ProductQuestionsAnswersProps {
  questionsAnswers: QuestionAnswer[]
  onAddQuestionAnswer: () => void
  onRemoveQuestionAnswer: (id: string) => void
}

export function ProductQuestionsAnswers({ 
  questionsAnswers,
  onAddQuestionAnswer,
  onRemoveQuestionAnswer
}: ProductQuestionsAnswersProps) {
  const sortedQA = [...questionsAnswers].sort((a, b) => a.order - b.order)

  return (
    <div className="pt-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Questions & Answers</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage product questions and answers
          </p>
        </div>
        <button
          type="button"
          onClick={onAddQuestionAnswer}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Question & Answer
        </button>
      </div>

      <div className="grid gap-4">
        {sortedQA.map((qa) => (
          <div 
            key={qa.id}
            className="bg-white border border-gray-200 rounded-lg p-4 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-grow">
                <div className="grid grid-cols-1 gap-1">
                  <div className="text-sm font-medium text-gray-900">
                    Question: {qa.question}
                  </div>
                  <div className="text-sm text-gray-700">
                    Answer: {qa.answer}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveQuestionAnswer(qa.id)}
                className="ml-4 text-red-600 hover:text-red-900"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {questionsAnswers.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-4">
            No questions and answers added yet
          </div>
        )}
      </div>
    </div>
  )
}