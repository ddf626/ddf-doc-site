---
title: IOC容器02 - ClassPathXmlApplicationContext的解耦
isTimeline: true
date: 2024-05-28
order: 2
---

上篇文章里我们实现了一个最简单的`IOC`容器，其中最核心的两个类包括

- `BeanDefinition`：`bean`在内存中的结构映射
- `ClassPathXmlApplicationContext`：负责读取配置文件、实例化`bean`对象、提供`getBean`方法

在这个过程中，`ClassPathXmlApplicationContext`承担了太多的功能，不符合对象的单一职责原则，因此需要考虑把这个类分解掉。

### 自定义`BeansException`

这一步并不重要，只是单独自定义一个`BeansException`用于区分异常。

```java
public class BeansException extends Exception {
    public BeansException(String message) {
        super(message);
    }
}
```

### 定义`BeanFactory`

首先，我们拆出一个基础的容器，命名为`BeanFactory`，用于存储`BeanDefinition`和`bean`的实例对象。

`BeanFactory`是一个接口，它有两个功能：

- 注册`BeanDefinition`
- 获取`bean`的实例对象

对应如下的两个方法

```java
public interface BeanFactory {
    /**
     * 获取bean的实例对象
     */
    Object getBean(String beanName);
    /**
     * 注册BeanDefinition
     */
    void registerBeanDefinition(BeanDefinition beanDefinition);
}
```

#### `BeanFactory`的实现类

新建一个`BeanFactory`的实现类，命名为`SimpleBeanFactory`。代码实现如下

```java
public class SimpleBeanFactory implements BeanFactory {
    private List<BeanDefinition> beanDefinitions = new ArrayList<>();
    private List<String> beanNames = new ArrayList<>();
    private Map<String, Object> beanMap = new HashMap<>();
    
    @Override
    public void registerBeanDefinition(BeanDefinition beanDefinition) {
        beanDefinitions.add(beanDefinition);
        beanNames.add(beanDefinition.getId());
    }
    
    @Override
    public Object getBean(String beanName) throws BeansException {
        Object bean = beanMap.get(beanName);
        if (bean != null) {
            return bean;
        }
        int i = beanNames.indexOf(beanName);
        if (i == -1) {
            throw new BeansException("bean not found");
        }
        BeanDefinition beanDefinition = beanDefinitions.get(i);
        try {
            bean = Class.forName(beanDefinition.getId()).getDeclaredConstructor().newInstance();
        } catch(Exception e) {
            e.printStackTrace();
        }
        beanMap.put(beanName, bean);
        return bean;
    }
}
```

至此，我们就将`ClassPathXmlApplicationContext`中，`BeanDefinition`和`bean`的存储功能拆分出来了，接下来我们将资源的读取功能拆分出来。

### `XmlBeanDefinitionReader`的定义

#### `Resource`的抽象

由于我们未来可能会从各种各样的存储介质中读取信息，因此我们首先将读取的各种资源抽象成一个接口`Resource`。无论我们读取的是何种信息，它都应该是一个可以遍历的信息，所以可以继承`iterator`接口。

```java
public interface Resource extends Iterator<Object> {
}
```

目前`bean`的定义信息主要存储在`xml`文件中，所以我们实现一个`ClassPathXmlResource`。

```java
public class ClassPathXmlResource implements Resource {
    Document document;
    Element rootElement;
    Iterator<Element> elementIterator;
    public ClassPathXmlResource(String fileName) {
        SAXReader saxReader = new SAXReader();
        URL xmlPath = this.getClass().getClassLoader().getResource(fileName);
        try {
            this.document = saxReader.read(xmlPath);
            this.rootElement = this.document.getRootElement();
            this.elementIterator = this.rootElement.elementIterator();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    @Override
    public boolean hasNext() {
        return this.elementIterator.hasNext();
    }
    @Override
    public Object next() {
        return this.elementIterator.next();
    }
}
```

#### `XmlBeanDefinitionReader`的定义

定义一个类`XmlBeanDefinitionReader`，主要用于读取各种`xml`资源。由于它需要将读取到的`bean`信息存入`BeanFactory`，所以它和`BeanFactory`应该是一个聚合关系

```java
public class XmlBeanDefinitionReader {
	private BeanFactory beanFactory;
    public XmlBeanDefinitionReader(BeanFactory beanFactory) {
        this.beanFactory = beanFactory;
    }
    /**
     * 从resource中读取BeanDefinition并存入BeanFactory
     */
    public void loadBeanDefinition(Resource resource) {
        while (resource.hasNext()) {
            Element element = resource.next();
            String beanId = element.attributeValue("id");
            String className = element.attributeValue("class");
            this.beanFactory.registerBeanDefinition(new BeanDefinition(beanId, className));
        }
    }
}
```

### `ClassPathXmlApplicationContext`的重新定义

至此，`ClassPathXmlApplicationContext`承载的所有功能已经分别由`BeanFactory`和`XmlBeanDefinitionReader`完成，它自身只需要做一些简单的聚合工作即可。

```java
public class ClassPathXmlApplicationContext implements BeanFactory {
    
    BeanFactory beanFactory;
    
    public ClassPathXmlApplicationContext(String fileName) {
        Resource resource = new ClassPathXmlResource(fileName);
        BeanFactory beanFactory = new BeanFactory();
        XmlBeanDefinitionReader reader = new XmlBeanDefinitionReader(beanFactory);
        reader.loadBeanDefinition(resource);
        
        this.beanFactory = beanFactory;
    }
    @Override
    public void registerBeanDefinition(BeanDefinition beanDefinition) {
        this.beanFactory.registerBeanDefinition(beanDefinition);
    }
    @Override
    public Object getBean(String beanName) {
        return this.beanFactory.getBean(beanName);
    }
}
```

### 本节类之间的关系

![几个类之间的关系](https://ddf-typora-pics.oss-cn-shanghai.aliyuncs.com/picGo202405282147501.png)

- 代码地址：https://github.com/ddf626/ddf-spring，分支：ioc-02

- 项目目录

```text
.
├── ddf-spring.iml
├── libs
│   └── dom4j-2.1.4.jar
├── resources
│   └── beans.xml
└── src
    └── com
        └── ddf
            └── spring
                ├── beans
                │   ├── BeanDefinition.java
                │   ├── BeanFactory.java
                │   ├── BeansException.java
                │   ├── SimpleBeanFactory.java
                │   └── XmlBeanDefinitionReader.java
                ├── context
                │   └── ClassPathXmlApplicationContext.java
                ├── core
                │   ├── ClassPathXmlResource.java
                │   └── Resource.java
                └── test
                    ├── AService.java
                    ├── Test.java
                    └── impl
                        └── AServiceImpl.java

```

