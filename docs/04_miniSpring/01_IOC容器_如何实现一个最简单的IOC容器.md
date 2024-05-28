---
title: IOC容器01 - 如何实现一个最简单的IOC容器
isTimeline: true
date: 2024-05-28
order: 1
---

## `IOC`容器的主要作用和组成

- `IOC`容器，存在的意义是将创建对象与使用对象的业务代码解耦，让业务开发人员无需关注底层对象（`Bean`）的构建和生命周期管理，专注于业务开发。
- `IOC`容器的几个部分
  - `BeanDefinition`：`Bean`的内存映像，即如何表示一个`bean`。
  - `XML Reader`：从外部`XML`文件中读取`Bean`的配置
  - 实例化：根据`bean`的定义，使用反射创建这个实例
  - `Bean`的存储：保存`Bean`的实例，并对外提供一个`getBean()`方法

![IOC的组成部分](https://ddf-typora-pics.oss-cn-shanghai.aliyuncs.com/picGo202405282041330.png)

## 如何实现一个最简单的`IOC`容器

- 创建Java项目：`ddf-spring`
- 导入<a href="https://dom4j.github.io">`dom4j`</a>包：，用于xml操作

### `BeanDefinition`定义

```java
public class BeanDefinition {

    private String id;

    private String className;

    public BeanDefinition(String id, String className) {
        this.id = id;
        this.className = className;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }
}

```

### 实现`ClassPathXmlApplicationContext`

`ClassPathXmlAppliationContext`提供以下3个功能：

- 从`xml`文件读取`bean`的定义，形成`BeanDefinition`并存储；
- 根据`BeanDefinition`，通过反射生成一个单例对象；
- 将单例对象存入容器`beanMap`，并对外提供`getBean`方法

```java
public class ClassPathXmlApplicationContext {

    /**
     * 从xml文件中读取的beanDefinition都放在这里
     */
    private List<BeanDefinition> beanDefinitions = new ArrayList<>();

    /**
     * 实例化出来的单例对象都放在这里
     * key: bean.id  value:bean.instance
     */
    private Map<String, Object> beanMap = new HashMap<>();

    public ClassPathXmlApplicationContext(String fileName) {
        // 读取xml文件
        this.readXml(fileName);
        // 实例化bean对象
        this.instanceBeans();
    }

    private void readXml(String fileName) {
        SAXReader saxReader = new SAXReader();
        try {
            URL xmlPath = this.getClass().getClassLoader().getResource(fileName);
            Document document = saxReader.read(xmlPath);
            Element rootElement = document.getRootElement();
            // 处理配置文件中的每一个<bean>标签
            for (Element element : rootElement.elements()) {
                String beanId = element.attributeValue("id");
                String beanClassName = element.attributeValue("class");
                beanDefinitions.add(new BeanDefinition(beanId, beanClassName));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 使用反射创建bean实例，并存储在beanMap中
     */
    private void instanceBeans() {
        for (BeanDefinition beanDefinition : beanDefinitions) {
            try {
                beanMap.put(beanDefinition.getId(),
                            Class.forName(beanDefinition.getClassName()).getDeclaredConstructor().newInstance());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    public Object getBean(String beanName) {
        return beanMap.get(beanName);
    }

}
```

### 测试

以上就实现了一个最基础版本的`IOC`容器，我们下面开始进行测试。

#### AService

```java
public interface AService {
    void hello();
}
```

#### AServiceImpl

```java
public class AServiceImpl implements AService {
    @Override
    public void hello() {
        System.out.println("AServiceImpl hello....");
    }
}
```

#### 配置文件

在项目根目录下建一个文件夹：`resources`，右键 -> `Mark Dictory As` -> `Resources`

在文件夹内新建文件`beans.xml`

```xml
<beans>
    <bean id="aService" class="com.ddf.spring.test.impl.AServiceImpl" />
</beans>
```

#### 测试类

```java
public class Test {

    public static void main(String[] args) {
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("beans.xml");
        AService aService = (AService) context.getBean("aService");
        aService.hello();
    }

}
```



> AServiceImpl hello....
>
> Process finished with exit code 0



- 代码地址：https://github.com/ddf626/ddf-spring，分支：ioc-01

- 项目目录

```text
├── ddf-spring.iml
├── libs
│   └── dom4j-2.1.4.jar
├── resources
│   └── beans.xml
└── src
    └── com
        └── ddf
            └── spring
                ├── BeanDefinition.java
                ├── ClassPathXmlApplicationContext.java
                └── test
                    ├── AService.java
                    ├── Test.java
                    └── impl
                        └── AServiceImpl.java
```



