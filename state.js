let state = {
    username: "",
};

export function getState() {
    return state;
}

export function setState(newProps) {
    state = { ...state, ...newProps };
}
