export interface State<Value = number> {
    value: Value,
    listener?(): void | Promise<void>
}

export type StateMachineEvent<State> = (s: State) => void

export class StateMachine {
    private value: State
    private readonly initialValue: State

    onChange?: StateMachineEvent<State>

    constructor(initialValue: State) {
        this.value = initialValue
        this.initialValue = initialValue
    }

    setState(value: State) {
        this.value = value
        this.onChange?.(this.value)
    }

    resetState() {
        this.value = this.initialValue
        this.onChange?.(this.value)
    }

    on(ev: State) {

    }
}
