/*
* <license header>
*/

// react imports
import React from 'react'
import PropTypes from 'prop-types'
import ErrorBoundary from 'react-error-boundary'

// react spectrum components
import { Provider, defaultTheme, Button, TextField, Link,
  Picker, Item, Form, Flex, ProgressCircle, Heading, Text } from '@adobe/react-spectrum'

// local imports
import './App.css'
import { actionWebInvoke } from './utils'
import actions from './config.json'

/* Here is your entry point React Component, this class has access to the Adobe Experience Cloud Shell runtime object */

export default class App extends React.Component {
  constructor (props) {
    super(props)

    // error handler on UI rendering failure
    this.onError = (e, componentStack) => {}

    // component to show if UI fails rendering
    this.fallbackComponent = ({ componentStack, error }) => (
      <React.Fragment>
        <h1 style={{ textAlign: 'center', marginTop: '20px' }}>Something went wrong :(</h1>
        <pre>{ componentStack + '\n' + error.message }</pre>
      </React.Fragment>
    )

    this.state = {
      actionSelected: null,
      actionResponse: null,
      actionResponseError: null,
      actionHeaders: null,
      actionHeadersValid: null,
      actionParams: null,
      actionParamsValid: null,
      actionInvokeInProgress: false
    }

    console.log('runtime object:', this.props.runtime)
    console.log('ims object:', this.props.ims)

    // use exc runtime event handlers
    // respond to configuration change events (e.g. user switches org)
    this.props.runtime.on('configuration', ({ imsOrg, imsToken, locale }) => {
      console.log('configuration change', { imsOrg, imsToken, locale })
    })
    // respond to history change events
    this.props.runtime.on('history', ({ type, path }) => {
      console.log('history change', { type, path })
    })
  }

  static get propTypes () {
    return {
      runtime: PropTypes.any,
      ims: PropTypes.any
    }
  }

  // parses a JSON input and adds it to the state
  async setJSONInput (input, stateJSON, stateValid) {
    let content
    let validStr = null
    if (input) {
      try {
        content = JSON.parse(input)
        validStr = 'valid'
      } catch (e) {
        content = null
        validStr = 'invalid'
      }
    }
    this.setState({ [stateJSON]: content, [stateValid]: validStr })
  }

  // invokes a the selected backend actions with input headers and params
  async invokeAction () {
    this.setState({ actionInvokeInProgress: true })
    const action = this.state.actionSelected
    const headers = this.state.actionHeaders || {}
    const params = this.state.actionParams || {}

    // all headers to lowercase
    Object.keys(headers).forEach(h => {
      const lowercase = h.toLowerCase()
      if (lowercase !== h) {
        headers[lowercase] = headers[h]
        headers[h] = undefined
        delete headers[h]
      }
    })
    // set the authorization header and org from the ims props object
    if (this.props.ims.token && !headers.authorization) {
      headers.authorization = 'Bearer ' + this.props.ims.token
    }
    if (this.props.ims.org && !headers['x-gw-ims-org-id']) {
      headers['x-gw-ims-org-id'] = this.props.ims.org
    }
    try {
      // invoke backend action
      const actionResponse = await actionWebInvoke(action, headers, params)
      // store the response
      this.setState({ actionResponse, actionResponseError: null, actionInvokeInProgress: false })
      console.log(`Response from ${action}:`, actionResponse)
    } catch (e) {
      // log and store any error message
      console.error(e)
      this.setState({ actionResponse: null, actionResponseError: e.message, actionInvokeInProgress: false })
    }
  }

  render () {
    return (
      // ErrorBoundary wraps child components to handle eventual rendering errors
      <ErrorBoundary onError={ this.onError } FallbackComponent={ this.fallbackComponent } >
      <Provider UNSAFE_className='provider' theme={ defaultTheme }>
        <Flex UNSAFE_className='main'>
          <Heading UNSAFE_className='main-title'>Welcome to AdorableWhitePelican!</Heading>

          <Flex UNSAFE_className='main-actions'>
            <h3 className='actions-title'>Run your application backend actions</h3>
            { Object.keys(actions).length > 0 &&
              <Form UNSAFE_className='actions-form' necessityIndicator='label'>
              <Picker
                placeholder='select an action'
                aria-label='select an action'
                items={ Object.keys(actions).map(k => ({ name: k })) }
                itemKey='name'
                onSelectionChange={ name => this.setState({ actionSelected: name, actionResponseError: null, actionResponse: null }) }>
                { item => <Item key={item.name}>{ item.name }</Item> }
              </Picker>
              <TextField
                label='headers'
                placeholder='{ "key": "value" }'
                validationState={ this.state.actionHeadersValid }
                onChange={ input => this.setJSONInput(input, 'actionHeaders', 'actionHeadersValid' ) }/>
              <TextField
                label='params'
                placeholder='{ "key": "value" }'
                validationState={ this.state.actionParamsValid }
                onChange={ input => this.setJSONInput(input, 'actionParams', 'actionParamsValid' ) }/>
              <Flex UNSAFE_className='actions-invoke'>
                <Button
                  UNSAFE_className='actions-invoke-button'
                  variant='primary'
                  onPress={ this.invokeAction.bind(this) }
                  isDisabled={ !this.state.actionSelected }>
                  Invoke
                </Button>
                <ProgressCircle
                  UNSAFE_className='actions-invoke-progress'
                  aria-label='loading'
                  isIndeterminate
                  isHidden={ !this.state.actionInvokeInProgress }/>
                </Flex>
              </Form>
            }
            { Object.keys(actions).length === 0 &&
              <Text>You have no actions !</Text>
            }
            { this.state.actionResponseError &&
              <Text UNSAFE_className='actions-invoke-error'>
                Failure! See the error in your browser console.
              </Text>
            }
            { !this.state.actionError && this.state.actionResponse &&
              <Text UNSAFE_className='actions-invoke-success'>
                Success! See the response content in your browser console.
              </Text>
            }
          </Flex>

          <Flex UNSAFE_className='main-doc'>
            <h3 className='doc-title'>Useful documentation for your app</h3>
            <Link UNSAFE_className='doc-item'>
              <a href='https://github.com/AdobeDocs/project-firefly/blob/master/README.md#project-firefly-developer-guide' target='_blank'>
                Firefly Apps
              </a>
            </Link>
            <Link UNSAFE_className='doc-item'>
              <a href='https://github.com/adobe/aio-sdk#adobeaio-sdk' target='_blank'>
                Adobe I/O SDK
              </a>
            </Link>
            <Link UNSAFE_className='doc-item'>
              <a href='https://adobedocs.github.io/adobeio-runtime/' target='_blank'>
                Adobe I/O Runtime
              </a>
            </Link>
            <Link UNSAFE_className='doc-item'>
              <a href='https://react-spectrum.adobe.com/react-spectrum/index.html' target='_blank'>
                React Spectrum
              </a>
            </Link>
          </Flex>

        </Flex>
      </Provider>
      </ErrorBoundary>
    )
  }
}
