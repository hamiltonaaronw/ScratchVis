#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform vec2 uRes;
uniform vec3 uSpec3;
uniform float uDeltaFreq;
uniform float uDeltaTime;
uniform float uFreq;
uniform float uLastFrame;
uniform float uLastFreq;
uniform float uSpecSum;
uniform float uTime;
uniform float uSpectrum[256];

#define sinc(x) sin(x) / x
#define cosc(x) cos(x) / x

out vec4 retColor;

mat2 rot(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
}

vec3 hsv2rgb(float h, float s, float v)
{
	return ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
}

vec3 tunnel(vec3 rd)
{
	vec2 p = rd.xy / rd.z;
	float tm = uTime * sign(rd.z) * 1.5;
	float pw = 0.5 + pow(min(abs(sin(tm * 0.1)) + 0.25, 1.0), 16.0) * 16.0;
	float r = pow(pow(p.x * p.x, pw) + pow(p.y * p.y, pw), 0.5 / pw);
	float x;

	float b = mod(fract(uFreq * 8.0) * 2.0, 1.0);
	float f = cos((sin(cos(b)) - sin(b) - b) + b * b);
	float ff = fract(fract(f * 100.0) + fract(f * 100.0)) + (fract(f  * 10.0)); 
	pw += float(uSpectrum[64]) * f / uSpectrum[128];

	for (int i = 1; i < 10; i++)
	{
		x = p.x + sin((0.5 / r + 0.5 * tm) * 2.0) * float(i) * float(i) * 0.001;
		pw = 0.5 + pow(min(abs(sin((tm + max(1.0 - r, 0.0)) * 0.1)) + 0.25, 1.0), 16.0) * 16.0;
		r = pow(pow(x * x, pw) + pow(p.y * p.y, pw), 0.5 / pw);
	}

	p.x = x;
	float a = atan(p.y, p.x) / PI;
	vec2 q = vec2(0.5 / r + 0.5 * tm, a) * 8.0;
	p.y *= sign(p.x);
	vec2 c = floor(q);
	q = fract(q);
	q.x = pow(q.x, clamp(abs(rd.z) + pw / 16.0, 1.0, 2.0));
	p = q;
	p = 2.0 * (p - 0.5);
	float r2 = pow(pow(p.x * p.x, pw) + pow(p.y * p.y, pw), 0.5 / pw);
	q = clamp(q * 1.5 - 0.25, 0.0, 1.0);
	vec3 co = vec3(0.5) + 0.5 * sin(vec3(c.xy, c.x + c.y) / (f * 10.0 / pw) / pw) * atan(f, pw);

	vec3 vf = vec3(
		uSpectrum[32] / f,
		uSpectrum[64] * f,
		uSpectrum[128] * f
	);

	if ((a < 0.25 && a > -0.25) || a < -0.75 || a > 0.75)
	{
		float d = max(abs(q.x - 0.5), abs(q.y - 0.5)) - 0.5;

		if (d < 0.0)
		{
			if (rd.z < 0.0)
				q.y = 1.0 - q.y;
			co = mix(co, vf, smoothstep(0.0, 0.05, -d));
		}
	}

	co *= 2.0 * pow(r, 1.75) * clamp(3.0 - r2 * 3.0, 0.0, 1.0);
	if (co != co)
		co = vec3(0.0);
	co *= hsv2rgb(vf.r, vf.g, vf.b) + pw;
	co += co.y - length(vf);
	co *= co.z;
	co.b += co.r * sin(uTime);

	co /= length(vf + f) + cross(vf, co) + pw;
	
	return clamp(co, 0.0, 1.0);
}

mat3 lookAt(vec3 fw, vec3 up)
{
	fw = normalize(fw);
	vec3 rt = normalize(cross(fw, normalize(up)));
	return mat3(
		rt, cross(rt, fw), fw
	);
}

struct intersect{
	float t;
	float d;
	vec3 n;
}

I1 = intersect(0.0, 0.0, vec3(0.0)), I2;

void zStack(intersect I, float px)
{
	if (I.t <= 0.0 || I.d > px * I.t)
		return;
	if (I.t < I1.t)
	{
		I2 = I1;
		I1 = I;
	}
	else if (I.t < I2.t)
		I2 = I;
}

#define maxDepth 10.0

intersect Segment(vec3 pS, vec3 pD, float r, vec3 rd)
{
	intersect intr = intersect(0.0, maxDepth, vec3(0.0));
	float d =  dot(rd, pD);
	float t = clamp((dot(rd, pS) * d - dot(pS, pD)) / (dot(pD, pD) - d * d), 0.0, 1.0);
	pS += pD * t;
	intr.n = -pS;
	float b = dot(pS, rd);
	float h = b * b - dot(pS, pS);
	d = sqrt(max(0.0, -h)) - r;
	intr.d = max(0.0, d);
	intr.t = b + min(d, 0.0) - sqrt(max(0.0, h + r * r));
	return intr;
}

vec3 light(intersect I, vec3 rd, float px, vec3 co)
{
	float aac = 1.0 - clamp(I.d / (px * I.t), 0.0, 1.0);

	if (aac > 0.0)
	{
		vec3 n = normalize(rd * I.t + I.n);
		vec3 l = normalize(vec3(0.5, 0.8, 0.4));
		vec3 r = reflect(rd, n);
		co = mix(co, (vec3(1.0, 0.3, 0.4) + 0.2 * tunnel(r)) * (0.5 + 0.5 * dot(l, n)), aac);
	}

	return co;
}

vec3 jSolve(vec3 a, vec3 b, float ln, vec3 rt)
{
	vec3 p = b - a;
	vec3 q = p * 0.5;
	return a + q + sqrt(max(0.0, ln * ln - dot(q, q))) * normalize(cross(p, rt));
}

vec3 britBot(vec3 ro, vec3 rd, vec3 co)
{
	float px = 2.5 / uRes.y;
	float tm = uTime * 10.0;
	I1.t = I2.t = I1.d = I2.d = maxDepth;
	float ct = cos(tm);
	float st = sin(tm);
	float st2 = sin(tm * 0.3);
	float h = (ct + st) * ct * -0.25;
	vec3 b1 = vec3(0.0, h, 0.0);
	vec3 b2 = vec3(st2 * 0.2, -0.75 + h, -0.2);

	vec3 le;
	vec3 lh = vec3(
		-0.75 + 0.1 * st,
		-0.4 - 0.2 * ct,
		0.3 - 0.3 * ct
	);
	vec3 re;
	vec3 rh = vec3(
		0.75 + 0.1 * st,
		-0.4 - 0.2 * st,
		0.3 + 0.3 * ct
	);
	vec3 lk;
	vec3 lf = vec3(
		-0.25,
		-2.0 + max(0.0, ct * 0.5),
		-0.25 + 0.4 * st
	);
	vec3 rk;
	vec3 rf = vec3(
		0.25,
		-2.0 + max(0.0, -ct * 0.5),
		-0.25 - 0.4 * st
	);
	vec3 rt = normalize(vec3(1.0 + 0.4 * st2, -0.4 * st2, 0.0));

	le = jSolve(b1, lh, 0.6, rt.yxz);
	re = jSolve(b1, rh, 0.6, -rt.yxz);
	lk = jSolve(b2, lf, 0.7, rt);
	rk = jSolve(b2, rf, 0.7, rt);

	float tr = 0.15;
	vec3 n = vec3(tr, 0.0, -tr * 0.5);
	zStack(Segment(b1 - ro, b2 - b1, tr, rd), px);
	tr *= 0.75;
	zStack(Segment(lk - ro, b2 - n.xyy - lk, tr, rd), px);
	zStack(Segment(rk - ro, b2 + n.xyy - rk, tr, rd), px);
	tr *= 0.75;
	zStack(Segment(lf - ro, lk - lf, tr, rd), px);
	zStack(Segment(rf - ro, rk - rf, tr, rd), px);
	tr *= 0.75;
	zStack(Segment(le - ro, b1 - n.xyy - le, tr, rd), px);
	zStack(Segment(re - ro, b1 + n.xyy - re, tr, rd), px);
	tr *= 0.75;
	zStack(Segment(lh - ro, le - lh, tr, rd), px);
	zStack(Segment(rh - ro, re - rh, tr, rd), px);

	mat3 mx = lookAt(vec3(st2 * ct, 0.25 * (st2 + st), 1.0),
					 vec3(0.25 * st2 * st, 1.0, 0.25 * st2 * ct));
	vec3 n1 = vec3(0.0, 0.25 + h, 0.0) * mx;
	vec3 h1 = vec3(-0.4, 0.25 + h, 0.0) * mx;
	vec3 h2 = vec3(-0.4, 0.75 + h, 0.0) * mx;
	vec3 h3 = vec3(0.4, 0.75 + h, 0.0) * mx;
	vec3 h4 = vec3(0.4, 0.25 + h, 0.0) * mx;

	n = vec3(0.0, 0.0, 1.0) * mx;
	float t = -dot(n, ro) / dot(n, rd);
	if (t > 0.0)
	{
		vec3 p = mx * (ro + rd * t);
		p.y -= h;
		if (p.x > -0.4 && p.x < 0.4 && p.y > 0.25 && p.y < 0.75)
			co = vec3(0.0);
	}

	zStack(Segment(b1 - ro, n1 - b1, tr, rd), px);
	zStack(Segment(h1 - ro, h2 - h1, tr, rd), px);
	zStack(Segment(h2 - ro, h3 - h2, tr, rd), px);
	zStack(Segment(h3 - ro, h4 - h3, tr, rd), px);
	zStack(Segment(h1 - ro, h4 - h1, tr, rd), px);

	co = light(I2, rd, px, co);
	co = light(I1, rd, px, co);

	return co;
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);
	vec2 q = p;

	float tm = uTime * 0.1;
	vec3 ro = vec3(sin(tm), 0.0, cos(tm) * 3.0);
	tm = abs(sin(tm * 1.5));
	vec3 up = vec3(1.0 - tm, 1.0, 0.0);
	vec3 rd = lookAt(-ro, up) * normalize(vec3(p, 1.0));
	c = tunnel(rd);
	c = britBot(ro, rd, c);

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.01 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv;
	
	uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;
	//uv = (2.0 * gl_FragCoord.xy - uRes.xy) / uRes.y;

	vec4 ret;

	vec3 c = col(uv);
	//float a = smoothstep(0.0, 0.1, min(min(c.r, c.g), c.b));

	ret = vec4(c, 1.0);

	retColor = ret;
}