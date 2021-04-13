import React from "react"
import ZmageSSR from "react-zmage/ssr/index.js"
import "react-zmage/ssr/style.css"

const Zmage = ({ src, ...rest }) => <ZmageSSR src={src} {...rest} />

export default Zmage
