import { enqueueSetState } from './queue'

class Component {
  constructor(props = {}) {
    this.state = {}
    this.props = props
  }

  setState(value) {
    enqueueSetState(value, this)
  }
}

export default Component
