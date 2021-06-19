import Tabs from "@theme/Tabs"
import TabItem from "@theme/TabItem"
import React from "react"
function MultiLanguageCode({ js, java }) {
  return (
    <>
      <Tabs
        defaultValue='js'
        values={[
          { label: "JavaScript", value: "js" },
          { label: "Java", value: "java" },
        ]}
      >
        <TabItem value='js'>
          ```js ${js}
          ```
        </TabItem>
        <TabItem value='java'>
          ```java ${java}
          ```
        </TabItem>
      </Tabs>
    </>
  )
}
export default MultiLanguageCode
