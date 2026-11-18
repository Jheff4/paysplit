import { render, screen } from '@testing-library/react'
import { App } from './App'

test('shows the PaySplit heading', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1, name: 'PaySplit' })).toBeInTheDocument()
})
