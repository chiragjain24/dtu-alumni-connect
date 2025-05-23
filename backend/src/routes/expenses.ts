import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const FakeExpenses: Expense[] = [
    {id: 1, title: 'Expense 1', amount: 100},
    {id: 2, title: 'Expense 2', amount: 200},
    {id: 3, title: 'Expense 3', amount: 300},
]

const expenseSchema = z.object({ // for runtime validation
    id: z.number().int().positive().min(1),
    title: z.string().min(3).max(20),
    amount: z.number().int().positive(),
})
const createExpenseSchema = expenseSchema.omit({id: true})
type Expense = z.infer<typeof expenseSchema>

export const expensesRoute = new Hono()
.get('/', (c) => {
    return c.json({
        expenses: FakeExpenses
    })
})
.post('/', zValidator('json', createExpenseSchema), async (c) => {
    const expense = c.req.valid('json');
    FakeExpenses.push({
        id: FakeExpenses.length + 1,
        ...expense
    });
    return c.json({
        expenses: FakeExpenses
    });
}) 
.get('/:id{[0-9]+}', (c) => {
    const id = Number.parseInt(c.req.param("id"));
    const expense = FakeExpenses.find(expense => expense.id === id);
    if (!expense) {
        return c.notFound();
    }
    return c.json({expense: expense});    
})

